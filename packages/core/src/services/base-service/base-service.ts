import { ELoadBalancerStatus, IRotationParams } from "../event/types";
import { NodesModel, INode } from "../../models";
import { Service as AlertService } from "../alert";
import { Service as HAProxyService } from "../haproxy";

import env from "../../environment";

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
    manual = false,
  }: IRotationParams): Promise<boolean> {
    if (env("MONITOR_TEST") && !env("MONITOR_TEST_DOMAIN")) return false;

    try {
      if (!manual) {
        const status = await this.getServerStatus({ destination, server, loadBalancers });
        if (status === ELoadBalancerStatus.ONLINE) return false;
        if (status === ELoadBalancerStatus.ERROR) {
          const message = this.alert.getErrorMessage(server, "error");
          throw message;
        }
      }

      const loadBalancerResponse = await Promise.all(
        loadBalancers.map(({ fqdn, ip }) =>
          this.haProxy.enableServer({
            destination,
            server,
            domain: this.getLoadBalancerDomain(fqdn || ip, true),
          }),
        ),
      );

      return loadBalancerResponse.every(Boolean);
    } catch (error) {
      const message = `Could not add ${destination}/${server} to rotation. ${error}`;
      throw new Error(message);
    }
  }

  async disableServer({
    destination,
    server,
    loadBalancers,
    manual = false,
  }: IRotationParams): Promise<boolean> {
    if (env("MONITOR_TEST") && !env("MONITOR_TEST_DOMAIN")) return false;

    try {
      const { online: nodeCount } = await this.getServerCount({
        destination,
        loadBalancers,
      });
      if (!manual) {
        if (nodeCount <= 1) {
          const message = this.alert.getErrorMessage(server, "count", nodeCount);
          throw message;
        }

        const status = await this.getServerStatus({ destination, server, loadBalancers });
        if (status === ELoadBalancerStatus.OFFLINE) return false;
        if (status === ELoadBalancerStatus.ERROR) {
          const message = this.alert.getErrorMessage(server, "error");
          throw message;
        }
      }

      const loadBalancerResponse = await Promise.all(
        loadBalancers.map(({ fqdn, ip }) =>
          this.haProxy.disableServer({
            destination,
            server,
            domain: this.getLoadBalancerDomain(fqdn || ip, true),
          }),
        ),
      );
      return loadBalancerResponse.every(Boolean);
    } catch (error) {
      const message = `Could not remove ${destination}/${server} from rotation. ${error}`;
      throw new Error(message);
    }
  }

  /** Ensures that the Load Balancer's IP is replaced with locahost when running in test mode.
   * This prevents the automation from taking production nodes out of protation. */
  private getLoadBalancerDomain(domain: string, automation = false): string {
    if (automation && env("MONITOR_TEST")) {
      return env("MONITOR_TEST_DOMAIN");
    }

    return domain;
  }

  /* ----- Server Check Methods ----- */
  async getServerCount({
    destination,
    loadBalancers,
    frontendUrl,
    dispatch,
  }: IRotationParams): Promise<{ online: number; total: number }> {
    const results: { online: number; total: number }[] = [];

    if (frontendUrl) {
      const domain = frontendUrl.split("//")[1].split(":")[0];

      try {
        return await this.haProxy.getServerCount({ destination, domain, dispatch });
      } catch (error) {
        throw `Could not get frontend count.\nURL: ${domain} Frontend: ${destination} ${error}`;
      }
    } else {
      for await (const { fqdn, ip } of loadBalancers) {
        try {
          const count = await this.haProxy.getServerCount({
            destination,
            domain: this.getLoadBalancerDomain(fqdn || ip),
            dispatch,
          });
          results.push(count);
        } catch (error) {
          throw `Could not get backend count.\nIP: ${ip} Backend: ${destination} ${error}`;
        }
      }

      if (results.every(({ online }) => online === results[0].online)) {
        return results[0];
      }
    }

    return null;
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
}
