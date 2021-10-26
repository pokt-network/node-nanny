import axios, { AxiosInstance } from "axios";
import { Reboot, HAProxy, Alert, DataDog } from "../../services";
import { NodesModel, INode, HostsModel } from "../../models";
import { HealthTypes } from "../../types";

export class Service {
  private agent: AxiosInstance;
  private reboot: Reboot;
  private haproxy: HAProxy;
  private alert: Alert;
  private dd: DataDog;

  constructor() {
    this.agent = this.initAgentClient();
    this.reboot = new Reboot();
    this.haproxy = new HAProxy();
    this.alert = new Alert();
    this.dd = new DataDog();
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  async getNode(id): Promise<INode> {
    return await NodesModel.findById(id).exec();
  }

  async getLoadBalancers() {
    if (process.env.MONITOR_TEST === "1") {
      return [
        {
          internalHostName: "ip-10-0-0-102.us-east-2.compute.internal",
          externalHostName: "ec2-18-118-59-87.us-east-2.compute.amazonaws.com",
        },
        {
          internalHostName: "ip-10-0-0-85.us-east-2.compute.internal",
          externalHostName: "ec2-18-189-159-188.us-east-2.compute.amazonaws.com",
        },
      ];
    }
    return await HostsModel.find(
      { loadBalancer: true },
      { internalHostName: 1, externalHostName: 1 },
    ).exec();
  }

  async getHaProxyStats(id: string) {
    const { backend } = await this.getNode(id);
    const loadBalancers = await this.getLoadBalancers();
    const results = [];
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(
          `http://${internalHostName}:3001/webhook/lb/status`,
          { backend },
        );
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${internalHostName} ${backend} ${error}`);
      }
    }
    if (results.every((result) => result.status.allOnline === true)) {
      return true;
    }
    return false;
  }

  async getMonitorStatus(id: string) {
    const { monitorId } = await this.getNode(id);
    return await this.dd.getMonitorStatus(monitorId);
  }

  async rebootServer(id: string) {
    const { host, chain, container, compose, nginx, poktType } = await this.getNode(id);

    const Host = await HostsModel.findOne({ name: host.name }).exec();
    if (!!Host) {
      let { internalIpaddress: ip } = Host;

      if (process.env.MONITOR_TEST === "1") {
        ip = "localhost";
      }

      let reboot;

      if (chain.type === HealthTypes.SupportedBlockChains.POKT) {
        const { data } = await this.agent.post(`http://${ip}:3001/webhook/docker/reboot`, {
          name: container,
          type: "pokt",
          nginx,
          poktType,
        });
        reboot = data.reboot;
      } else {
        const { data } = await this.agent.post(`http://${ip}:3001/webhook/docker/reboot`, {
          name: container,
          type: "data",
          compose,
        });
        reboot = data.reboot;
      }
      await this.dd.muteMonitor({ id, minutes: 5 });
      return reboot;
    }
    return;
  }

  async removeFromRotation(id: string) {}

  async addToRotation(id: string) {}

  async muteMonitor(id: string) {}

  async unmuteMonitor(id: string) {}
}
