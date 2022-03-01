import { EC2 } from "aws-sdk";
import axios, { AxiosInstance } from "axios";

import { Alert, DataDog } from "..";
import { NodesModel, INode, HostsModel } from "../../models";
import { HealthTypes, DataDogTypes, RebootTypes } from "../../types";

export class Service {
  private agent: AxiosInstance;
  private alert: Alert;
  private dd: DataDog;
  private ec2: EC2;

  constructor() {
    this.agent = this.initAgentClient();
    this.ec2 = new EC2({ region: "us-east-2" });
    this.alert = new Alert();
    this.dd = new DataDog();
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  private async getNode(id: string): Promise<INode> {
    return NodesModel.findById(id)
      .populate("chain")
      .populate("host")
      .populate("loadBalancers")
      .exec();
  }

  async getHaProxyStatus(id: string) {
    const { backend, haProxy, server, loadBalancers } = await this.getNode(id);
    if (haProxy === false) {
      return -1;
    }

    const results: (boolean | -1)[] = [];
    for (const { ip } of loadBalancers) {
      try {
        const { data } = await this.agent.post<{ status: boolean | -1 }>(
          `http://${ip}:3001/webhook/lb/status`,
          { backend, server },
        );
        results.push(data.status);
      } catch (error) {
        throw new Error(
          `Could not get backend status, ${ip} ${server} ${backend} ${error}`,
        );
      }
    }

    if (results.every((status) => status === true)) {
      return 0;
    }
    return 1;
  }

  // DEV NOTE -> Need to rewrite to be logger-agnostic
  async getMuteStatus(id: string): Promise<boolean> {
    const { monitorId } = await this.getNode(id);
    const { options } = await this.dd.getMonitor(monitorId);
    const muted = options.silenced.hasOwnProperty("*");
    return muted;
  }

  async getMonitorStatus(id: string) {
    const { monitorId } = await this.getNode(id);
    const status = await this.dd.getMonitorStatus(monitorId);
    return !(status === DataDogTypes.Status.ALERT);
  }

  async rebootServer(id: string): Promise<string> {
    const {
      host,
      chain,
      hostname,
      container,
      compose,
      nginx,
      poktType,
      monitorId,
    } = await this.getNode(id);

    const Host = await HostsModel.findOne({ name: host.name }).exec();

    if (Host) {
      let { ip } = Host;

      if (process.env.MONITOR_TEST === "1") {
        ip = "localhost";
      }

      let reboot: string;

      if (chain.type === HealthTypes.ESupportedBlockChains.POKT) {
        const { data } = await this.agent.post<{ reboot: string }>(
          `http://${ip}:3001/webhook/docker/reboot`,
          {
            name: container,
            type: RebootTypes.ENodeTypes.POKT,
            nginx,
            poktType,
          },
        );
        reboot = data.reboot;
      } else {
        const { data } = await this.agent.post<{ reboot: string }>(
          `http://${ip}:3001/webhook/docker/reboot`,
          {
            name: container,
            type: RebootTypes.ENodeTypes.DATA,
            compose,
          },
        );
        reboot = data.reboot;
      }
      await this.dd.muteMonitor({ id: monitorId, minutes: 5 });
      await this.alert.sendInfo({
        title: "Manual Reboot",
        message: `${
          hostname ? hostname : `${host.name}/${chain.name.toLowerCase()}/${container}`
        } rebooted \n ${reboot}`,
        chain: chain.name,
      });

      return reboot;
    }

    return;
  }

  async removeFromRotation(id: string): Promise<boolean> {
    const {
      backend,
      server,
      hostname,
      host,
      chain,
      container,
      loadBalancers,
    } = await this.getNode(id);

    try {
      await Promise.all(
        loadBalancers.map(({ ip }) =>
          this.agent.post(`http://${ip}:3001/webhook/lb/disable`, {
            backend,
            server,
          }),
        ),
      );

      return await this.alert.sendInfo({
        title: "Removed from rotation",
        message: `${
          hostname ? hostname : `${host.name}/${chain.name}/${container}`
        } removed from ${backend}`,
        chain: chain.name,
      });
    } catch (error) {
      throw new Error(`Could not remove ${backend} ${server} from rotation, ${error}`);
    }
  }

  async addToRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, container, loadBalancers } = await this.getNode(
      id,
    );

    try {
      await Promise.all(
        loadBalancers.map(({ ip }) =>
          this.agent.post(`http://${ip}:3001/webhook/lb/enable`, {
            backend,
            server,
          }),
        ),
      );

      return await this.alert.sendInfo({
        title: "Added to rotation",
        message: `${host.name}/${chain.name}/${container} to ${backend}`,
        chain: chain.name,
      });
    } catch (error) {
      throw new Error(`Could not add ${backend} ${server} rotation, ${error}`);
    }
  }

  async muteMonitor(id: string): Promise<boolean> {
    const { monitorId } = await this.getNode(id);
    const response = await this.dd.muteMonitor({ id: monitorId, minutes: 525600 });
    return !!response;
  }

  async unmuteMonitor(id: string): Promise<boolean> {
    const { monitorId } = await this.getNode(id);
    const response = await this.dd.unmuteMonitor({ id: monitorId });
    return !!response;
  }

  async getInstanceDetails(awsInstanceId: string) {
    try {
      const details = await this.ec2
        .describeInstances({
          InstanceIds: [awsInstanceId],
        })
        .promise();

      const instance = details.Reservations[0].Instances[0];
      const {
        PrivateDnsName: internalHostName,
        PrivateIpAddress: ip,
        PublicDnsName: externalHostName,
      } = instance;

      const { Value: name } = instance.Tags.find(({ Key }) => Key === "Name");

      return {
        name,
        ip,
        internalHostName,
        externalHostName,
        awsInstanceId,
        hostType: "AWS",
      };
    } catch (error) {
      return false;
    }
  }

  async findAndStoreAWSHost({
    awsInstanceId,
    loadBalancer,
  }: {
    awsInstanceId: string;
    loadBalancer: boolean;
  }) {
    const instance = await this.getInstanceDetails(awsInstanceId);
    if (instance) {
      const data = Object.assign(instance, { loadBalancer });
      return await HostsModel.create(data);
    }

    throw new Error(`could not create host ${awsInstanceId}`);
  }
}
