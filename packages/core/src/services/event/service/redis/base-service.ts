import axios, { AxiosInstance } from "axios";

import { Alert } from "../../..";
import { LoadBalancerStatus } from "../../types";
import { IRotationParams } from "./types";
import { NodesModel, INode } from "../../../../models";

export default class Service {
  private agent: AxiosInstance;
  public alert: Alert;

  constructor() {
    this.agent = axios.create({ headers: { "Content-Type": "application/json" } });
    this.alert = new Alert();
  }

  async getNode(id: string): Promise<INode> {
    return await NodesModel.findOne({ _id: id })
      .populate("host")
      .populate("chain")
      .populate("loadBalancers")
      .exec();
  }

  /* ----- Toggle Server Methods ----- */
  async enableServer({ backend, server, loadBalancers }: IRotationParams) {
    try {
      const status = await this.getServerStatus({ backend, server, loadBalancers });
      if (status === LoadBalancerStatus.ONLINE) {
        const message = this.getErrorMessage(server, "online");
        await this.alert.sendErrorChannel({ title: backend, message });
        throw message;
      }

      return (
        await Promise.all(
          loadBalancers.map(({ ip }) =>
            this.agent.post<{ status: string }>(`http://${ip}:3001/webhook/lb/enable`, {
              backend,
              server,
            }),
          ),
        )
      ).every(({ data }) => Boolean(data?.status));
    } catch (error) {
      const message = `Could not contact agent to enable server. ${error}`;
      await this.alert.sendErrorChannel({ title: backend, message });
    }
  }

  async disableServer({ backend, server, loadBalancers }: IRotationParams) {
    try {
      const count = await this.getServerCount({ backend, loadBalancers });
      if (count <= 1) {
        const message = this.getErrorMessage(server, "count", count);
        await this.alert.sendErrorChannel({ title: backend, message });
        throw message;
      }

      const status = await this.getServerStatus({ backend, server, loadBalancers });
      if (status === LoadBalancerStatus.OFFLINE) {
        const message = this.getErrorMessage(server, "offline");
        await this.alert.sendErrorChannel({ title: backend, message });
        throw message;
      }

      return (
        await Promise.all(
          loadBalancers.map(({ ip }) =>
            this.agent.post<{ status: string }>(`http://${ip}:3001/webhook/lb/disable`, {
              backend,
              server,
            }),
          ),
        )
      ).every(({ data }) => Boolean(data?.status));
    } catch (error) {
      await this.alert.sendErrorChannel({ title: backend, message: error });
      throw new Error(error);
    }
  }

  /* ----- Server Check Methods ----- */
  private async getServerCount({
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
        throw `Could not get backend status.\nIP: ${ip} Backend: ${backend} ${error}`;
      }
    }

    if (results.every((count) => count === results[0])) {
      return results[0];
    }
    return -1;
  }

  private async getServerStatus({
    backend,
    server,
    loadBalancers,
  }: IRotationParams): Promise<LoadBalancerStatus> {
    const results: boolean[] = [];
    for (const { ip } of loadBalancers) {
      try {
        const { data } = await this.agent.post<{ status: boolean }>(
          `http://${ip}:3001/webhook/lb/status`,
          { backend, server },
        );
        results.push(data.status);
      } catch (error) {
        throw `Could not get backend status.\nIP: ${ip} Backend: ${backend} ${error}`;
      }
    }

    console.debug("INSIDE BACKEND STATUS CHECK", { results });

    if (results.every((status) => status === true)) {
      return LoadBalancerStatus.ONLINE;
    }
    if (results.every((status) => status === false)) {
      return LoadBalancerStatus.OFFLINE;
    }
    return LoadBalancerStatus.ERROR;
  }

  /* ----- Message String Methods ----- */
  getHAProxyMessage({ backend, loadBalancers }: IRotationParams): string {
    const urls = loadBalancers
      .map(({ ip }) => `http://${ip}:8050/stats/;up?scope=${backend}\n`)
      .join("");
    return `HAProxy Status\n${urls}`;
  }

  private getErrorMessage(
    server: string,
    mode: "count" | "offline" | "online",
    count?: number,
  ): string {
    return {
      count: `Could not remove ${server} from load balancer. ${
        count === 1 ? "Only one server" : "No servers"
      } online.\nManual intervention required.`,
      offline: `Could not remove ${server} from load balancer. Server already offline.`,
      online: `Could not add ${server} to load balancer. Server already online.`,
    }[mode];
  }
}
