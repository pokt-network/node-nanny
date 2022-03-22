import { EC2 } from "aws-sdk";
import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import { FilterQuery } from "mongoose";

import BaseService from "../base-service/base-service";
import { Service as DiscordService } from "../discord";
import { LoadBalancerStatus } from "../event/types";
import {
  LogsModel,
  NodesModel,
  ILog,
  INode,
  IPaginatedLogs,
  HostsModel,
  ChainsModel,
} from "../../models";
import { INodeInput, INodeCsvInput, INodeLogParams } from "./types";

export class Service extends BaseService {
  private ec2: EC2;

  constructor() {
    super();
    this.ec2 = new EC2({ region: "us-east-2" });
  }

  /* ----- CRUD Methods ----- */
  public async createNode(nodeInput: INodeInput, restart = true): Promise<INode> {
    let id: string;
    try {
      ({ id } = await NodesModel.create(nodeInput));
      const node = await this.getNode(id);

      await new DiscordService().addWebhookForNode(node);

      if (restart) await this.restartMonitor();

      return node;
    } catch (error) {
      await NodesModel.deleteOne({ _id: id });
      throw error;
    }
  }

  public async createNodesCSV(nodes: INodeCsvInput[]): Promise<INode[]> {
    try {
      const createdNodes: INode[] = [];
      for await (const nodeInput of nodes) {
        const nodeInputWithIds: INodeInput = {
          ...nodeInput,
          chain: await ChainsModel.findOne({ name: nodeInput.chain }),
          host: await HostsModel.findOne({ name: nodeInput.host }),
          loadBalancers: (
            await HostsModel.find({ name: { $in: nodeInput.loadBalancers } })
          ).map(({ _id }) => _id),
        };

        const node = await this.createNode(nodeInputWithIds, false);
        createdNodes.push(node);
      }

      await this.restartMonitor();

      return createdNodes;
    } catch (error) {
      throw new Error(`Node CSV creation error: ${error}`);
    }
  }

  public async getLogsForNode({
    nodeIds,
    startDate,
    endDate,
    page,
    limit,
  }: INodeLogParams): Promise<IPaginatedLogs> {
    const query: FilterQuery<ILog> = { $and: [{ label: { $in: nodeIds } }] };
    if (startDate) query.$and.push({ timestamp: { $gte: new Date(startDate) } });
    if (endDate) query.$and.push({ timestamp: { $lte: new Date(endDate) } });

    return await LogsModel.paginate(query, { page, limit, sort: { timestamp: -1 } });
  }

  /* ---- Rotation Methods ----- */
  async addToRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, container, loadBalancers } = await this.getNode(
      id,
    );

    await this.enableServer({ backend, server, loadBalancers });

    return await this.alert.sendInfo({
      title: "Added to rotation",
      message: `${host.name}/${chain.name}/${container} to ${backend}`,
      chain: chain.name,
    });
  }

  async removeFromRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, container, loadBalancers } = await this.getNode(
      id,
    );

    await this.disableServer({ backend, server, loadBalancers, manual: true });

    return await this.alert.sendInfo({
      title: "Removed from rotation",
      message: `${host.name}/${chain.name}/${container} removed from ${backend}`,
      chain: chain.name,
    });
  }

  /* ----- Status Check Methods ----- */
  async getHaProxyStatus(id: string): Promise<-1 | 0 | 1> {
    const { backend, haProxy, server, loadBalancers } = await this.getNode(id);
    if (haProxy === false) {
      return -1;
    }

    const result = await this.getServerStatus({
      backend,
      server,
      loadBalancers,
    });

    if (result === LoadBalancerStatus.ONLINE) {
      return 0;
    }
    return 1;
  }

  // async getMonitorStatus(id: string) {
  //   const { monitorId } = await this.getNode(id);
  //   const status = await this.dd.getMonitorStatus(monitorId);
  //   return !(status === DataDogTypes.Status.ALERT);
  // }

  /* ----- Reboot Methods ----- */
  // async rebootServer(id: string): Promise<string> {
  //   const {
  //     host,
  //     chain,
  //     hostname,
  //     container,
  //     compose,
  //     nginx,
  //     poktType,
  //   } = await this.getNode(id);
  //   const { ip } = await HostsModel.findOne({ name: host.name });

  //   const requestData =
  //     chain.type === HealthTypes.ESupportedBlockChains.POKT
  //       ? {
  //           name: container,
  //           type: RebootTypes.ENodeTypes.POKT,
  //           nginx,
  //           poktType,
  //         }
  //       : {
  //           name: container,
  //           type: RebootTypes.ENodeTypes.DATA,
  //           compose,
  //         };

  //   const { data } = await this.agent.post<{ reboot: string }>(
  //     `http://${this.getLoadBalancerIP(ip)}:3001/webhook/docker/reboot`,
  //     requestData,
  //   );
  //   const { reboot } = data;

  //   const hostString =
  //     hostname || `${host.name}/${chain.name.toLowerCase()}/${container}`;
  //   const message = `${hostString} rebooted.\n${reboot}`;
  //   await this.alert.sendInfo({ title: "Manual Reboot", message, chain: chain.name });

  //   return reboot;
  // }

  async muteMonitor(id: string): Promise<INode> {
    await NodesModel.updateOne({ _id: id }, { muted: true }).exec();
    await this.restartMonitor();
    return await this.getNode(id);
  }

  async unmuteMonitor(id: string): Promise<INode> {
    await NodesModel.updateOne({ _id: id }, { muted: false });
    await this.restartMonitor();
    return await this.getNode(id);
  }

  private async restartMonitor(): Promise<boolean> {
    try {
      return await new Promise((resolve, reject) => {
        exec("pm2 restart monitor", (error, stdout) => {
          if (error) reject(`error: ${error.message}`);
          resolve(!!stdout);
        });
      });
    } catch (error) {
      console.log("Cannot restart monitor, monitor not running.");
    }
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
