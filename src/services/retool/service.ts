import { EC2 } from "aws-sdk";
import axios, { AxiosInstance } from "axios";
import { Alert, DataDog } from "../../services";
import { NodesModel, INode, HostsModel } from "../../models";
import { HealthTypes, DataDogTypes } from "../../types";

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

  private async getNode(id): Promise<INode> {
    return await NodesModel.findById(id).exec();
  }

  private async getLoadBalancers() {
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

  async getHaProxyStatus(id: string) {
    const { backend, haProxy, server } = await this.getNode(id);
    if (haProxy === false) {
      return -1;
    }
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
        throw new Error(
          `could not get backend status, ${internalHostName} ${server} ${backend} ${error}`,
        );
      }
    }
    if (results.every(({ status }) => status === true)) {
      return 0;
    }
    return 1;
  }

  async getMuteStatus(id: string) {
    const { monitorId } = await this.getNode(id);
    const { options } = await this.dd.getMonitor(monitorId);
    return !options.silenced.hasOwnProperty("*");
  }

  async getMonitorStatus(id: string) {
    const { monitorId } = await this.getNode(id);
    const status = await this.dd.getMonitorStatus(monitorId);
    return !(status === DataDogTypes.Status.ALERT);
  }

  async rebootServer(id: string) {
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
      await this.dd.muteMonitor({ id: monitorId, minutes: 5 });
      await this.alert.sendInfo({
        title: "Manual Reboot",
        message: `${
          hostname ? hostname : `${host.name}/${chain.name.toLowerCase()}`
        } rebooted \n ${reboot}`,
      });

      return reboot;
    }
    return;
  }

  async removeFromRotation(id: string) {
    const { backend, server, hostname, host, chain } = await this.getNode(id);
    const loadBalancers = await this.getLoadBalancers();
    try {
      await Promise.all(
        loadBalancers.map(({ internalHostName }) =>
          this.agent.post(`http://${internalHostName}:3001/webhook/lb/disable`, {
            backend,
            server,
          }),
        ),
      );

      return await this.alert.sendInfo({
        title: "Removed from rotation",
        message: `${hostname ? hostname : `${host.name}/${chain.name}`} removed from ${backend}`,
      });
    } catch (error) {
      throw new Error(`could not remove ${backend} ${server}from rotation, ${error}`);
    }
  }

  async addToRotation(id: string) {
    const { backend, server, hostname, host, chain } = await this.getNode(id);
    const loadBalancers = await this.getLoadBalancers();
    try {
      await Promise.all(
        loadBalancers.map(({ internalHostName }) =>
          this.agent.post(`http://${internalHostName}:3001/webhook/lb/enable`, {
            backend,
            server,
          }),
        ),
      );
      return await this.alert.sendInfo({
        title: "Added to rotation",
        message: `${hostname ? hostname : `${host.name}/${chain.name}`} added to ${backend}`,
      });
    } catch (error) {
      throw new Error(`could not add ${backend} ${server} rotation, ${error}`);
    }
  }

  async muteMonitor(id: string) {
    const { monitorId } = await this.getNode(id);
    return await this.dd.muteMonitor({ id: monitorId, minutes: 525600 });
  }

  async unmuteMonitor(id: string) {
    const { monitorId } = await this.getNode(id);
    return await this.dd.unmuteMonitor({ id: monitorId });
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
        PrivateIpAddress: internalIpaddress,
        PublicDnsName: externalHostName,
      } = instance;

      const { Value: name } = instance.Tags.find(({ Key }) => Key === "Name");

      return {
        name,
        internalIpaddress,
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
