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
    destination,
    server,
    loadBalancers,
  }: IRotationParams): Promise<boolean> {
    try {
      const loadBalancerResponse = await Promise.all(
        loadBalancers.map(({ fqdn, ip }) =>
          this.haProxy.enableServer({
            destination,
            server,
            domain: this.getLoadBalancerDomain(fqdn || ip),
          }),
        ),
      );

      return loadBalancerResponse.every(Boolean);
    } catch (error) {
      const message = `Could not add ${destination}/${server} to rotation. ${error}`;
      colorLog(message, "red");
      await this.alert.sendErrorChannel({ title: destination, message });
      throw new Error(message);
    }
  }

  async disableServer({
    destination,
    server,
    loadBalancers,
    manual = false,
  }: IRotationParams): Promise<boolean> {
    try {
      const serverCount = await this.getServerCount({ destination, loadBalancers });
      if (!manual) {
        if (serverCount <= 1) {
          const message = this.getErrorMessage(server, "count", serverCount);
          colorLog(message, "red");
          await this.alert.sendErrorChannel({ title: destination, message });
          throw new Error(message);
        }

        const status = await this.getServerStatus({ destination, server, loadBalancers });
        if (status === ELoadBalancerStatus.OFFLINE) {
          const message = this.getErrorMessage(server, "offline");
          colorLog(message, "red");
          await this.alert.sendErrorChannel({ title: destination, message });
          throw new Error(message);
        }
      }

      const loadBalancerResponse = await Promise.all(
        loadBalancers.map(({ fqdn, ip }) =>
          this.haProxy.disableServer({
            destination,
            server,
            domain: this.getLoadBalancerDomain(fqdn || ip),
          }),
        ),
      );
      return loadBalancerResponse.every(Boolean);
    } catch (error) {
      const message = `Could not remove ${destination}/${server} from rotation. ${error}`;
      colorLog(message, "red");
      await this.alert.sendErrorChannel({ title: destination, message });
      throw new Error(message);
    }
  }

  /** Ensures that the Load Balancer's IP is replaced with locahost when running in test mode.
   * This prevents the automation from taking production nodes out of protation. */
  private getLoadBalancerDomain(ip: string): string {
    if (process.env.MONITOR_TEST === "1") {
      return "ec2-3-145-99-143.us-east-2.compute.amazonaws.com";
    }
    return ip;
  }

  /* ----- Server Check Methods ----- */
  async getServerCount({
    destination,
    loadBalancers,
    frontendUrl,
  }: IRotationParams): Promise<number> {
    const results: number[] = [];
    if (frontendUrl) {
      const domain = frontendUrl.split("//")[1].split(":")[0];
      try {
        return await this.haProxy.getServerCount({ destination, domain });
      } catch (error) {
        throw `Could not get frontend count.\nURL: ${domain} Frontend: ${destination} ${error}`;
      }
    } else {
      for await (const { fqdn, ip } of loadBalancers) {
        try {
          const count = await this.haProxy.getServerCount({
            destination,
            domain: this.getLoadBalancerDomain(fqdn || ip),
          });
          results.push(count);
        } catch (error) {
          throw `Could not get backend count.\nIP: ${ip} Backend: ${destination} ${error}`;
        }
      }

      if (results.every((count) => count === results[0])) {
        return results[0];
      }
    }
    return -1;
  }

  async getServerStatus({
    destination,
    server,
    loadBalancers,
  }: IRotationParams): Promise<ELoadBalancerStatus> {
    const results: boolean[] = [];

    for (const { fqdn, ip } of loadBalancers) {
      try {
        const status = await this.haProxy.getServerStatus({
          destination,
          server,
          domain: this.getLoadBalancerDomain(fqdn || ip),
        });
        results.push(status);
      } catch (error) {
        throw `Could not get backend status.\nIP: ${ip} Backend: ${destination} ${error}`;
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
  getHAProxyMessage({ destination, loadBalancers }: IRotationParams): string {
    if (process.env.MONITOR_TEST === "1") return "";
    const urls = loadBalancers
      .map(({ ip, url }) => `http://${url || ip}:8050/stats?scope=${destination}`)
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
