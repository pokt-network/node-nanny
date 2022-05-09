import { exec } from "child_process";
import { UpdateQuery } from "mongoose";

import { Service as DiscordService } from "../discord";
import { ELoadBalancerStatus } from "../event/types";
import {
  NodesModel,
  IHost,
  INode,
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
  INodeUpdate,
} from "./types";
import { Service as HealthService } from "../health";
import { IHealthCheck } from "../health/types";
import { Service as BaseService } from "../base-service/base-service";

export class Service extends BaseService {
  constructor() {
    super();
  }

  /* ----- CRUD Methods ----- */
  public async createHost(hostInput: IHostInput, restart = true): Promise<IHost> {
    const sanitizedInput = this.sanitizeCreate(hostInput);

    const { _id } = await HostsModel.create(sanitizedInput);

    if (restart) await this.restartMonitor();

    return await HostsModel.findOne({ _id }).populate("location").exec();
  }

  public async createHostsCSV(hosts: IHostCsvInput[]): Promise<IHost[]> {
    try {
      const createdHosts: IHost[] = [];
      for await (const hostInput of hosts) {
        const hostInputObj: IHostInput = {
          ...hostInput,
          loadBalancer: Boolean(hostInput.loadBalancer),
          location: (await LocationsModel.findOne({ name: hostInput.location }))._id,
        };

        const host = await this.createHost(hostInputObj, false);
        createdHosts.push(host);
      }

      await this.restartMonitor();

      return createdHosts;
    } catch (error) {
      throw new Error(`Host CSV creation error: ${error}`);
    }
  }

  public async createNode(nodeInput: INodeInput, restart = true): Promise<INode> {
    let id: string;
    const { https, automation, frontend, ...rest } = nodeInput;
    const { fqdn } = await HostsModel.findOne({ _id: nodeInput.host });

    if (https && !fqdn) {
      throw new Error(`Node cannot use https with a host that does not have a FQDN.`);
    }

    try {
      const sanitizedInput = this.sanitizeCreate({ ...rest, port: Number(rest.port) });
      ({ id } = await NodesModel.create(sanitizedInput));

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
        const host = await HostsModel.findOne({ name: nodeInput.host });
        const https = Boolean(nodeInput.https === "true");
        const { fqdn, ip } = host;

        const nodeInputWithIds: INodeInput = {
          ...nodeInput,
          https,
          chain: (await ChainsModel.findOne({ name: nodeInput.chain }))._id,
          host: host._id,
          url: `http${https ? "s" : ""}://${fqdn || ip}:${nodeInput.port}`,
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

  public async updateHost(
    unsanitizedUpdate: IHostUpdate,
    restart = true,
  ): Promise<IHost> {
    const { id } = unsanitizedUpdate;
    delete unsanitizedUpdate.id;
    const update = this.sanitizeUpdate(unsanitizedUpdate);

    const { ip, fqdn, name } = (await HostsModel.findOne({ _id: id })) as IHost<false>;
    const newName = update.name && update.name !== name;
    const newIp = update.ip && update.ip !== ip;
    const newFqdn = update.fqdn && update.fqdn !== fqdn;

    /* If Host Name changes, all node names on that host will need to be updated */
    if (newName && (await NodesModel.exists({ host: id }))) {
      await this.updateNodeNamesIfHostNameChanges(id, update.name, name);
    }

    /* If Host IP or FQDN changes, all node URLs on that host will need to be updated */
    if ((newIp || newFqdn) && (await NodesModel.exists({ host: id }))) {
      await this.updateNodeUrlsIfHostDomainChanges(id, update);
    }
    if (ip && update.fqdn) {
      update.$unset = { ...update.$unset, ip: 1 };
    }
    if (fqdn && update.ip) {
      update.$unset = { ...update.$unset, fqdn: 1 };
    }

    await HostsModel.updateOne({ _id: id }, { ...update });
    if (restart) await this.restartMonitor();

    return await HostsModel.findOne({ _id: id }).populate("location").exec();
  }

  private async updateNodeNamesIfHostNameChanges(
    id: string,
    newHostName: string,
    oldHostName: string,
  ) {
    const nodesForHost = NodesModel.find({ host: id });

    for await (const { id, name } of nodesForHost) {
      const newNodeName = name.replace(oldHostName, newHostName);

      await NodesModel.updateOne({ _id: id }, { name: newNodeName });
    }
  }

  private async updateNodeUrlsIfHostDomainChanges(
    id: string,
    update: UpdateQuery<IHost>,
  ) {
    const nodesForHost = NodesModel.find({ host: id });

    for await (const node of nodesForHost) {
      const [protocol] = update.ip ? ["http"] : node.url.split("://");
      const newRootDomain = update.ip || update.fqdn;
      const newUrl = `${protocol}://${newRootDomain}:${node.port}`;

      await NodesModel.updateOne({ _id: node.id }, { url: newUrl });
    }
  }

  public async updateNode(
    unsanitizedUpdate: INodeUpdate,
    restart = true,
  ): Promise<INode> {
    const { id, https } = unsanitizedUpdate;
    delete unsanitizedUpdate.id;
    delete unsanitizedUpdate.https;
    const update = this.sanitizeUpdate(unsanitizedUpdate);

    const { host, url, port } = (await NodesModel.findOne({ _id: id })) as INode<false>;
    const newHost = update.host !== host;

    /* If Node's fields change, the node's URL must be updated to reflect the changes */
    if (newHost) {
      const { fqdn, ip } = await HostsModel.findOne({ _id: host });
      update.url = `${fqdn || ip}:${port}`;
    }
    if (update.port) {
      update.url = (newHost ? update.url : url.split("://")[1]).replace(
        String(port),
        String(update.port),
      );
    }
    if (update.url) {
      const secure = typeof https === "boolean" && https;
      update.url = `http${secure ? "s" : ""}://${update.url}`;
    }

    await NodesModel.updateOne({ _id: id }, { ...update, port: Number(update.port) });
    if (restart) await this.restartMonitor();

    return await this.getNode(id);
  }

  public async deleteHost(id: string, restart = true): Promise<IHost> {
    const host = await HostsModel.findOne({ _id: id }).populate("location").exec();

    await HostsModel.deleteOne({ _id: id });
    if (restart) await this.restartMonitor();

    return host;
  }

  public async deleteNode(id: string, restart = true): Promise<INode> {
    const node = await this.getNode(id);

    await NodesModel.deleteOne({ _id: id });
    if (restart) await this.restartMonitor();

    return node;
  }

  private sanitizeCreate(unsanitizedCreate: { [key: string]: any }): UpdateQuery<any> {
    const input: UpdateQuery<any> = {};
    Object.entries(unsanitizedCreate).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        input[key] = typeof value === "string" ? value.trim() : value;
      }
    });
    return input;
  }

  private sanitizeUpdate(unsanitizedUpdate: { [key: string]: any }): UpdateQuery<any> {
    const update: UpdateQuery<any> = {};
    Object.entries(unsanitizedUpdate).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        if (Object.keys(update).includes("$unset")) {
          update.$unset[key] = 1;
        } else {
          update.$unset = {};
          update.$unset[key] = 1;
        }
      } else {
        update[key] = typeof value === "string" ? value.trim() : value;
      }
    });
    return update;
  }

  /* ----- Health Check Methods ----- */
  async getHealthCheck(id: string): Promise<IHealthCheck> {
    const node = await NodesModel.findOne({ _id: id })
      .populate("host")
      .populate("chain")
      .exec();

    const {
      status,
      conditions,
      height,
      details,
      ethSyncing,
    } = await new HealthService().getNodeHealth(node);
    const { status: nodeStatus, conditions: nodeConditions } = node;

    if (status !== nodeStatus || conditions !== nodeConditions) {
      await NodesModel.updateOne({ _id: id }, { status, conditions });
    }

    const updatedNodeHealth = { ...node, status, conditions };
    return { height, details, ethSyncing, node: updatedNodeHealth };
  }

  /* ----- Rotation Methods ----- */
  async addToRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, loadBalancers } = await this.getNode(id);

    await this.enableServer({ destination: backend, server, loadBalancers });

    return await this.alert.sendInfo({
      title: "[Manually Added to Rotation] - Success",
      message: `${host.name}/${chain.name}/${server} added to ${backend}.`,
      chain: chain.name,
      location: host.location.name,
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
      title: "[Manually Removed from Rotation] - Success",
      message: `${host.name}/${chain.name}/${server} removed from ${backend}.`,
      chain: chain.name,
      location: host.location.name,
    });
  }

  /* ----- Status Check Methods ----- */
  async getHaProxyStatus(id: string): Promise<-1 | 0 | 1> {
    const { backend, automation, server, loadBalancers } = await this.getNode(id);
    if (automation === false) {
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

  async getServerCountForUi(id: string) {
    const { backend, dispatch, frontend, loadBalancers, url } = await this.getNode(id);

    return await this.getServerCount({
      destination: frontend || backend,
      loadBalancers,
      dispatch,
      frontendUrl: frontend ? url : null,
    });
  }

  async checkValidHaProxy({
    backend,
    frontend,
    host,
    loadBalancers: loadBalancerIds,
  }: INodeInput): Promise<boolean> {
    if (frontend && host) {
      const { fqdn, ip } = await HostsModel.findOne({ _id: host });

      return await this.getValidHaProxy({
        destination: frontend,
        frontendUrl: fqdn || ip,
      });
    } else if (backend) {
      const loadBalancers = await HostsModel.find({ _id: { $in: loadBalancerIds } });

      return await this.getValidHaProxy({ destination: backend, loadBalancers });
    }
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
}
