import { EC2 } from "aws-sdk";
import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import { FilterQuery } from "mongoose";

import { Service as DiscordService } from "../discord";
import {
  LogsModel,
  NodesModel,
  ILog,
  INode,
  IPaginatedLogs,
  HostsModel,
  ChainsModel,
} from "../../models";
import { HealthTypes, RebootTypes } from "../../types";
import { INodeInput, INodeCsvInput, INodeLogParams } from "./types";
import { Alert } from "..";

export class Service {
  private agent: AxiosInstance;
  private alert: Alert;
  private ec2: EC2;

  constructor() {
    this.agent = this.initAgentClient();
    this.ec2 = new EC2({ region: "us-east-2" });
    this.alert = new Alert();
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  private async getNode(id: string): Promise<INode> {
    return await NodesModel.findById(id)
      .populate("chain")
      .populate({ path: "host", populate: "location" })
      .populate("loadBalancers")
      .exec();
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

    try {
      await Promise.all(
        loadBalancers.map(({ ip }) =>
          this.agent.post(`http://${this.getLoadBalancerIP(ip)}:3001/webhook/lb/enable`, {
            backend,
            server,
          }),
        ),
      );
    } catch (error) {
      throw new Error(`Could not add ${backend} ${server} to rotation. ${error}`);
    }

    try {
      return await this.alert.sendInfo({
        title: "Added to rotation",
        message: `${host.name}/${chain.name}/${container} to ${backend}`,
        chain: chain.name,
      });
    } catch (error) {
      throw new Error(`Could not send webhook alert. ${error}`);
    }
  }

  async removeFromRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, container, loadBalancers } = await this.getNode(
      id,
    );

    try {
      await Promise.all(
        loadBalancers.map(({ ip }) =>
          this.agent.post(
            `http://${this.getLoadBalancerIP(ip)}:3001/webhook/lb/disable`,
            { backend, server },
          ),
        ),
      );
    } catch (error) {
      throw new Error(`Could not remove ${backend} ${server} from rotation. ${error}`);
    }

    try {
      return await this.alert.sendInfo({
        title: "Removed from rotation",
        message: `${host.name}/${chain.name}/${container} removed from ${backend}`,
        chain: chain.name,
      });
    } catch (error) {
      throw new Error(`Could not send webhook alert. ${error}`);
    }
  }

  /* ----- Status Check Methods ----- */
  async getHaProxyStatus(id: string) {
    const { backend, haProxy, server, loadBalancers } = await this.getNode(id);
    if (haProxy === false) {
      return -1;
    }

    const results: (boolean | -1)[] = [];
    for await (const { ip } of loadBalancers) {
      try {
        const { data } = await this.agent.post<{ status: boolean | -1 }>(
          `http://${this.getLoadBalancerIP(ip)}:3001/webhook/lb/status`,
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

  // async getMonitorStatus(id: string) {
  //   const { monitorId } = await this.getNode(id);
  //   const status = await this.dd.getMonitorStatus(monitorId);
  //   return !(status === DataDogTypes.Status.ALERT);
  // }

  /* ----- Reboot Methods ----- */
  async rebootServer(id: string): Promise<string> {
    const {
      host,
      chain,
      hostname,
      container,
      compose,
      nginx,
      poktType,
    } = await this.getNode(id);
    const { ip } = await HostsModel.findOne({ name: host.name });

    const requestData =
      chain.type === HealthTypes.ESupportedBlockChains.POKT
        ? {
            name: container,
            type: RebootTypes.ENodeTypes.POKT,
            nginx,
            poktType,
          }
        : {
            name: container,
            type: RebootTypes.ENodeTypes.DATA,
            compose,
          };

    const { data } = await this.agent.post<{ reboot: string }>(
      `http://${this.getLoadBalancerIP(ip)}:3001/webhook/docker/reboot`,
      requestData,
    );
    const { reboot } = data;

    const hostString =
      hostname || `${host.name}/${chain.name.toLowerCase()}/${container}`;
    const message = `${hostString} rebooted.\n${reboot}`;
    await this.alert.sendInfo({ title: "Manual Reboot", message, chain: chain.name });

    return reboot;
  }

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

  /* ---- Private Methods ----- */
  /** Ensures that the Load Balancer's IP is replaced with locahost when running in test mode.
   * This prevents the automation from takings production nodes out of protation. */
  private getLoadBalancerIP(ip: string): string {
    if (process.env.MONITOR_TEST === "1") return "localhost";
    return ip;
  }
}
