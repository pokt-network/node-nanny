import axios, { AxiosInstance } from "axios";

import { Alert } from "../../..";
import { LoadBalancerStatus, LoadBalancer } from "../../types";
import { AlertTypes } from "../../../../types";
import { HostsModel, NodesModel, INode } from "../../../../models";
import { EErrorConditions } from "../../../health/types";

export default class Service {
  sendError: ({
    title,
    message,
    chain,
  }: AlertTypes.IWebhookMessageParams) => Promise<boolean>;
  sendInfo: ({
    title,
    message,
    chain,
  }: AlertTypes.IWebhookMessageParams) => Promise<boolean>;
  sendWarn: ({
    title,
    message,
    chain,
  }: AlertTypes.IWebhookMessageParams) => Promise<boolean>;
  sendSucess: ({
    title,
    message,
    chain,
  }: AlertTypes.IWebhookMessageParams) => Promise<boolean>;
  EErrorConditions: typeof EErrorConditions;

  constructor() {
    this.sendError = new Alert().sendError;
    this.sendInfo = new Alert().sendInfo;
    this.sendWarn = new Alert().sendWarn;
    this.sendSucess = new Alert().sendSuccess;
    this.agent = this.initAgentClient();
    this.EErrorConditions = EErrorConditions;
  }
  private agent: AxiosInstance;
  private alert: Alert;

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  async getNode(id): Promise<INode> {
    return await NodesModel.findOne({ _id: id })
      .populate("host")
      .populate("chain")
      .exec();
  }
  async getLoadBalancers(loadBalancers: string[]): Promise<LoadBalancer[]> {
    return await HostsModel.find({ _id: { $in: loadBalancers } }).exec();
  }

  async disableServer({ backend, server, loadBalancers }) {
    try {
      const status = await this.getBackendServerStatus({
        backend,
        server,
        loadBalancers,
      });
      const count = await this.getBackendServerCount({ backend, loadBalancers });
      if (count <= 1) {
        return await this.alert.sendErrorChannel({
          title: backend,
          message: `could not remove ${server} from load balancer, ${count} server online \n
          manual intervention required`,
        });
      }

      if (status === LoadBalancerStatus.OFFLINE) {
        return await this.alert.sendErrorChannel({
          title: backend,
          message: `could not remove from load balancer, server already offline`,
        });
      }

      const lbs = await this.getLoadBalancers(loadBalancers);
      return await Promise.all(
        lbs.map(async ({ ip }) =>
          this.agent.post(`http://${ip}:3001/webhook/lb/disable`, {
            backend,
            server,
          }),
        ),
      );
    } catch (error) {
      this.alert.sendErrorChannel({
        title: backend,
        message: `could not remove from load balancer, ${error}`,
      });
    }
  }

  async enableServer({ backend, server, loadBalancers }) {
    try {
      const lbs = await this.getLoadBalancers(loadBalancers);
      return await Promise.all(
        lbs.map(({ ip }) =>
          this.agent.post(`http://${ip}:3001/webhook/lb/enable`, {
            backend,
            server,
          }),
        ),
      );
    } catch (error) {
      return this.alert.sendErrorChannel({
        title: backend,
        message: `could not contact agent to enable , ${error}`,
      });
    }
  }

  async getBackendServerStatus({ backend, server, loadBalancers }) {
    const lbs = await this.getLoadBalancers(loadBalancers);
    const results = [];
    for (const { ip } of lbs) {
      try {
        const { data } = await this.agent.post(`http://${ip}:3001/webhook/lb/status`, {
          backend,
          server,
        });
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${ip} ${backend} ${error}`);
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

  async getBackendServerCount({ backend, loadBalancers }) {
    const lbs = await this.getLoadBalancers(loadBalancers);
    let results = [];
    for (const { ip } of lbs) {
      try {
        const { data } = await this.agent.post(`http://${ip}:3001/webhook/lb/count`, {
          backend,
        });
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${ip} ${backend} ${error}`);
      }
    }

    results = results.map(({ status }) => status);

    if (results.every((count) => count === results[0])) {
      return results[0];
    }
    return -1;
  }

  async getHAProxyMessage({ backend, loadBalancers }) {
    const hosts = await this.getLoadBalancers(loadBalancers);
    const urls = hosts
      .map((host) => {
        return `http://${host.ip}:8050/stats/;up?scope=${backend} \n`;
      })
      .join("");
    return `HAProxy status\n${urls}`;
  }
}
