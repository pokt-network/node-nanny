import axios, { AxiosInstance } from "axios";

import { Alert } from "../../..";
import { AlertTypes } from "../../../../types";
import { LoadBalancerStatus, LoadBalancer } from "../../types";
import { IRotationParams } from "./types";
import { HostsModel, NodesModel, INode } from "../../../../models";

export default class Service {
  private agent: AxiosInstance;
  // DEV NOTE -> Do we need this?
  sendErrorChannel: AlertTypes.ISendAlert;
  sendError: AlertTypes.ISendAlert;
  sendInfo: AlertTypes.ISendAlert;
  sendWarn: AlertTypes.ISendAlert;
  sendSuccess: AlertTypes.ISendAlert;

  constructor() {
    this.agent = this.initAgentClient();
    // DEV NOTE -> Do we need this?
    this.sendErrorChannel = new Alert().sendErrorChannel;
    this.sendError = new Alert().sendError;
    this.sendInfo = new Alert().sendInfo;
    this.sendWarn = new Alert().sendWarn;
    this.sendSuccess = new Alert().sendSuccess;
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  async getNode(id: string): Promise<INode> {
    return await NodesModel.findOne({ _id: id })
      .populate("host")
      .populate("chain")
      .populate("loadBalancers")
      .exec();
  }

  async getLoadBalancers(loadBalancers: string[]): Promise<LoadBalancer[]> {
    return await HostsModel.find({ _id: { $in: loadBalancers } }).exec();
  }

  async disableServer({
    backend,
    server,
    loadBalancers,
  }: IRotationParams): Promise<void> {
    try {
      const count = await this.getBackendServerCount({ backend, loadBalancers });
      if (count <= 1) {
        await this.sendErrorChannel({
          title: backend,
          message: `Could not remove ${server} from load balancer, ${count} server online.\nManual intervention required.`,
        });
        return;
      }

      const status = await this.getBackendServerStatus({
        backend,
        server,
        loadBalancers,
      });
      if (status === LoadBalancerStatus.OFFLINE) {
        await this.sendErrorChannel({
          title: backend,
          message: `Could not remove from load balancer, server already offline.`,
        });
        return;
      }

      await Promise.all(
        loadBalancers.map(async ({ ip }) =>
          this.agent.post(`http://${ip}:3001/webhook/lb/disable`, {
            backend,
            server,
          }),
        ),
      );
    } catch (error) {
      await this.sendErrorChannel({
        title: backend,
        message: `Could not remove from load balancer. ${error}`,
      });
    }
  }

  async enableServer({ backend, server, loadBalancers }: IRotationParams): Promise<void> {
    try {
      await Promise.all(
        loadBalancers.map(({ ip }) =>
          this.agent.post(`http://${ip}:3001/webhook/lb/enable`, { backend, server }),
        ),
      );
    } catch (error) {
      await this.sendErrorChannel({
        title: backend,
        message: `Could not contact agent to enable server. ${error}`,
      });
    }
  }

  async getBackendServerStatus({ backend, server, loadBalancers }: IRotationParams) {
    const results = [];

    for (const { ip } of loadBalancers) {
      try {
        const { data } = await this.agent.post(`http://${ip}:3001/webhook/lb/status`, {
          backend,
          server,
        });
        results.push(data);
      } catch (error) {
        throw new Error(`Could not get backend status, ${ip} ${backend} ${error}`);
      }
    }

    if (results.every(({ status }) => status === true)) {
      return LoadBalancerStatus.ONLINE;
    }

    if (results.every(({ status }) => status === false)) {
      return LoadBalancerStatus.OFFLINE;
    }

    return LoadBalancerStatus.ERROR;
  }

  async getBackendServerCount({
    backend,
    loadBalancers,
  }: IRotationParams): Promise<number> {
    const results: number[] = [];

    for await (const { ip } of loadBalancers) {
      try {
        const { data } = await this.agent.post<{ status: number }>(
          `http://${ip}:3001/webhook/lb/count`,
          { backend },
        );
        results.push(data.status);
      } catch (error) {
        throw new Error(`Could not get backend status: ${ip} ${backend} ${error}`);
      }
    }

    if (results.every((count) => count === results[0])) {
      return results[0];
    }
    return -1;
  }

  getHAProxyMessage({ backend, loadBalancers }: IRotationParams): string {
    const urls = loadBalancers
      .map(({ ip }) => `http://${ip}:8050/stats/;up?scope=${backend}\n`)
      .join("");
    return `HAProxy Status\n${urls}`;
  }
}
