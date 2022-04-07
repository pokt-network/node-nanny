import { EC2 } from "aws-sdk";
import { exec } from "child_process";
import { FilterQuery } from "mongoose";

import { Service as DiscordService } from "../discord";
import { ELoadBalancerStatus } from "../event/types";
import {
  LogsModel,
  NodesModel,
  IHost,
  ILog,
  INode,
  IPaginatedLogs,
  ChainsModel,
  HostsModel,
  LocationsModel,
} from "../../models";
import {
  IHostInput,
  IHostCsvInput,
  IHostUpdate,
  INodeInput,
  INodeCsvInput,
  INodeLogParams,
  INodeUpdate,
} from "./types";
import { Service as BaseService } from "../base-service/base-service";

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
      const { fqdn, ip } = await HostsModel.findOne({ _id: nodeInput.host });
      const { port } = nodeInput;
      const url = fqdn ? `https://${fqdn}:${port}` : `http://${ip}:${port}`;

      ({ id } = await NodesModel.create({ ...nodeInput, url }));

      const node = await this.getNode(id);

      if (!nodeInput.frontend) await new DiscordService().addWebhookForNode(node);
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
          chain: (await ChainsModel.findOne({ name: nodeInput.chain }))._id,
          host: (await HostsModel.findOne({ name: nodeInput.host }))._id,
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

  public async createHostsCSV(hosts: IHostCsvInput[]): Promise<IHost[]> {
    try {
      const createdHosts: IHost[] = [];
      for await (let hostInput of hosts) {
        const hostInputObj: IHostInput = {
          name: hostInput.name,
          loadBalancer: Boolean(hostInput.loadBalancer),
          location: (await LocationsModel.findOne({ name: hostInput.location }))._id,
        };
        if (hostInput.ip) hostInputObj.ip = hostInput.ip;
        if (hostInput.fqdn) hostInputObj.fqdn = hostInput.fqdn;

        const host = await HostsModel.create(hostInputObj);
        createdHosts.push(host);
      }

      return createdHosts;
    } catch (error) {
      throw new Error(`Host CSV creation error: ${error}`);
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

  public async updateNode(update: INodeUpdate): Promise<INode> {
    const { id } = update;
    delete update.id;
    const sanitizedUpdate: any = {};
    Object.entries(update).forEach(([key, value]) => {
      if (value !== undefined) sanitizedUpdate[key] = value;
    });

    if (sanitizedUpdate.port) {
      const { url, port } = await NodesModel.findOne({ _id: id });
      sanitizedUpdate.url = url.replace(String(port), String(sanitizedUpdate.port));
    }

    await NodesModel.updateOne({ _id: id }, { ...sanitizedUpdate });
    return await this.getNode(id);
  }

  public async updateHost(update: IHostUpdate): Promise<IHost> {
    const { id } = update;
    delete update.id;
    const sanitizedUpdate: any = {};
    Object.entries(update).forEach(([key, value]) => {
      if (value !== undefined) sanitizedUpdate[key] = value;
    });

    await HostsModel.updateOne({ _id: id }, { ...sanitizedUpdate });
    return await HostsModel.findOne({ _id: id }).populate("location").exec();
  }

  public async deleteNode(id: string): Promise<INode> {
    const node = await this.getNode(id);
    await NodesModel.deleteOne({ _id: id });
    return node;
  }

  public async deleteHost(id: string): Promise<IHost> {
    const host = await HostsModel.findOne({ _id: id }).populate("location").exec();
    await HostsModel.deleteOne({ _id: id });
    return host;
  }

  /* ---- Rotation Methods ----- */
  async addToRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, loadBalancers } = await this.getNode(id);

    await this.enableServer({ destination: backend, server, loadBalancers });

    return await this.alert.sendInfo({
      title: "[Added to Rotation] - Success",
      message: `${host.name}/${chain.name}/${server} added to ${backend}.`,
      chain: chain.name,
    });
  }

  async removeFromRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, loadBalancers } = await this.getNode(id);

    await this.disableServer({
      destination: backend,
      server,
      loadBalancers,
      manual: true,
    });

    return await this.alert.sendInfo({
      title: "[Removed from Rotation] - Success",
      message: `${host.name}/${chain.name}/${server} removed from ${backend}.`,
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
      destination: backend,
      server,
      loadBalancers,
    });

    if (result === ELoadBalancerStatus.ONLINE) {
      return 0;
    }
    return 1;
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
}
