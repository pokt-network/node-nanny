import { ELoadBalancerStatus, IRotationParams } from "../event/types";
import { NodesModel, INode } from "../../models";
import { colorLog, s } from "../../utils";

import { Service as AlertService } from "../alert";
import { Service as HAProxyService } from "../haproxy";

export class Service {
  private haProxy: HAProxyService;
  public alert: AlertService;

  constructor() {
    this.haProxy = new HAProxyService();
    this.alert = new AlertService();
  }

  async getNode(id: string): Promise<INode> {
    return await NodesModel.findById(id)
      .populate("chain")
      .populate({ path: "host", populate: "location" })
      .populate("loadBalancers")
      .exec();
  }

  /* ----- Toggle Server Methods ----- */
  async enableServer({
    backend,
    server,
    loadBalancers,
  }: IRotationParams): Promise<boolean> {
    try {
      const loadBalancerResponse = await Promise.all(
        loadBalancers.map(({ fqdn, ip }) =>
          this.haProxy.enableServer({
            backend,
            server,
            destination: this.getLoadBalancerIP(fqdn || ip),
          }),
        ),
      );

      return loadBalancerResponse.every(Boolean);
    } catch (error) {
      const message = `Could not add ${backend}/${server} to rotation. ${error}`;
      colorLog(message, "red");
      await this.alert.sendErrorChannel({ title: backend, message });
      throw new Error(message);
    }
  }

  async disableServer({
    backend,
    server,
    loadBalancers,
    manual = false,
  }: IRotationParams): Promise<boolean> {
    try {
      const serverCount = await this.getServerCount({ backend, loadBalancers });
      if (!manual) {
        if (serverCount <= 1) {
          const message = this.getErrorMessage(server, "count", serverCount);
          colorLog(message, "red");
          await this.alert.sendErrorChannel({ title: backend, message });
          throw new Error(message);
        }

        const status = await this.getServerStatus({ backend, server, loadBalancers });
        if (status === ELoadBalancerStatus.OFFLINE) {
          const message = this.getErrorMessage(server, "offline");
          colorLog(message, "red");
          await this.alert.sendErrorChannel({ title: backend, message });
          throw new Error(message);
        }
      }

      const loadBalancerResponse = await Promise.all(
        loadBalancers.map(({ fqdn, ip }) =>
          this.haProxy.disableServer({
            backend,
            server,
            destination: this.getLoadBalancerIP(fqdn || ip),
          }),
        ),
      );
      return loadBalancerResponse.every(Boolean);
    } catch (error) {
      const message = `Could not remove ${backend}/${server} from rotation. ${error}`;
      colorLog(message, "red");
      await this.alert.sendErrorChannel({ title: backend, message });
      throw new Error(message);
    }
  }

  /** Ensures that the Load Balancer's IP is replaced with locahost when running in test mode.
   * This prevents the automation from taking production nodes out of protation. */
  private getLoadBalancerIP(ip: string): string {
    if (process.env.MONITOR_TEST === "1") {
      return "ec2-3-145-99-143.us-east-2.compute.amazonaws.com";
    }
    return ip;
  }

  /* ----- Server Check Methods ----- */
  async getServerCount({ backend, loadBalancers }: IRotationParams): Promise<number> {
    const results: number[] = [];
    for await (const { fqdn, ip } of loadBalancers) {
      try {
        const count = await this.haProxy.getServerCount({
          backend,
          destination: this.getLoadBalancerIP(fqdn || ip),
        });
        results.push(count);
      } catch (error) {
        throw `Could not get backend status.\nIP: ${ip} Backend: ${backend} ${error}`;
      }
    }

    if (results.every((count) => count === results[0])) {
      return results[0];
    }
    return -1;
  }

  async getServerStatus({
    backend,
    server,
    loadBalancers,
  }: IRotationParams): Promise<ELoadBalancerStatus> {
    const results: boolean[] = [];

    for (const { fqdn, ip } of loadBalancers) {
      try {
        const status = await this.haProxy.getServerStatus({
          backend,
          server,
          destination: this.getLoadBalancerIP(fqdn || ip),
        });
        results.push(status);
      } catch (error) {
        throw `Could not get backend status.\nIP: ${ip} Backend: ${backend} ${error}`;
      }
    }

    if (results.every((status) => status === true)) {
      return ELoadBalancerStatus.ONLINE;
    }
    if (results.every((status) => status === false)) {
      return ELoadBalancerStatus.OFFLINE;
    }
    return ELoadBalancerStatus.ERROR;
  }

  /* ----- Message String Methods ----- */
  getHAProxyMessage({ backend, loadBalancers }: IRotationParams): string {
    if (process.env.MONITOR_TEST === "1") return "";
    const urls = loadBalancers
      .map(({ ip, url }) => `http://${url || ip}:8050/stats?scope=${backend}`)
      .join("\n");
    return `HAProxy Status\n${urls}`;
  }

  private getErrorMessage(
    server: string,
    mode: "count" | "offline" | "online",
    count?: number,
  ): string {
    return {
      count: `Could not remove ${server} from load balancer. ${count} server${s(
        count,
      )} online.\nManual intervention required.`,
      offline: `Could not remove ${server} from load balancer. Server already offline.`,
      online: `Could not add ${server} to load balancer. Server already online.`,
    }[mode];
  }
}
