import axios, { AxiosInstance } from "axios";
import { DataDog, Alert } from "../../..";
import { LoadBalancerStatus, LoadBalancer } from "../../types";
import { HostsModel } from "../../../../models";
export class Service {
  private agent: AxiosInstance;
  private alert: Alert;
  private dd: DataDog;
  constructor() {
    this.agent = this.initAgentClient();
    this.alert = new Alert();
    this.dd = new DataDog();
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  async getLoadBalancers(): Promise<LoadBalancer[]> {
    return await HostsModel.find({}).exec();
  }

  async disableServer({ backend, server }) {
    try {
      const status = await this.getBackendServerStatus({ backend, server });
      const count = await this.getBackendServerCount(backend);
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

      const loadBalancers = await this.getLoadBalancers();
      return await Promise.all(
        loadBalancers.map(async ({ internalHostName }) =>
          this.agent.post(`http://${internalHostName}:3001/webhook/lb/disable`, {
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

  async enableServer({ backend, server }) {
    try {
      const loadBalancers = await this.getLoadBalancers();
      return await Promise.all(
        loadBalancers.map(({ internalHostName }) =>
          this.agent.post(`http://${internalHostName}:3001/webhook/lb/enable`, {
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

  async getBackendServerStatus({ backend, server }) {
    const loadBalancers = await this.getLoadBalancers();
    const results = [];
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(
          `http://${internalHostName}:3001/webhook/lb/status`,
          { backend, server },
        );
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${internalHostName} ${backend} ${error}`);
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

  async getBackendServerCount(backend) {
    const loadBalancers = await this.getLoadBalancers();
    let results = [];
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(`http://${internalHostName}:3001/webhook/lb/count`, {
          backend,
        });
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${internalHostName} ${backend} ${error}`);
      }
    }

    results = results.map(({ status }) => status);

    if (results.every((count) => count === results[0])) {
      return results[0];
    }
    return -1;
  }

  async getHAProxyMessage(backend) {
    const hosts = await this.getLoadBalancers();
    const urls = hosts
      .map((host) => {
        return `http://${host.externalHostName}:8050/stats/;up?scope=${backend} \n`;
      })
      .join("");
    return `HAProxy status\n${urls}`;
  }
}
