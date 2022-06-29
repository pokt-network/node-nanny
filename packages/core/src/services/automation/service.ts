import { exec } from 'child_process';
import { UpdateQuery } from 'mongoose';

import { Service as DiscordService } from '../discord';
import { ELoadBalancerStatus } from '../event/types';
import {
  IChain,
  IHost,
  ILocation,
  INode,
  IOracle,
  ChainsModel,
  HostsModel,
  LocationsModel,
  NodesModel,
  OraclesModel,
} from '../../models';
import {
  IAutomationServiceModels,
  IChainUpdate,
  IHostInput,
  IHostCsvInput,
  IHostUpdate,
  INodeInput,
  INodeCreationProps,
  INodeCsvInput,
  INodeUpdate,
  IOracleUpdate,
} from './types';
import { Service as HealthService } from '../health';
import { IHealthCheck } from '../health/types';
import { Service as BaseService } from '../base-service/base-service';

export class Service extends BaseService {
  private chainsModel: typeof ChainsModel;
  private hostsModel: typeof HostsModel;
  private locationsModel: typeof LocationsModel;
  private nodesModel: typeof NodesModel;
  private oraclesModel: typeof OraclesModel;

  constructor(externalModels: IAutomationServiceModels = null) {
    super();

    const { chainsModel, hostsModel, locationsModel, nodesModel, oraclesModel } =
      externalModels || {};
    this.chainsModel = chainsModel || ChainsModel;
    this.hostsModel = hostsModel || HostsModel;
    this.locationsModel = locationsModel || LocationsModel;
    this.nodesModel = nodesModel || NodesModel;
    this.oraclesModel = oraclesModel || OraclesModel;
  }

  /* ----- CRUD Methods ----- */
  public async createHost(hostInput: IHostInput, restart = true): Promise<IHost> {
    const sanitizedInput = this.sanitizeCreate(hostInput);

    const { _id } = await this.hostsModel.create(sanitizedInput);

    if (restart) await this.restartMonitor();

    return await this.hostsModel.findOne({ _id }).populate('location').exec();
  }

  public async createHostsCSV(hosts: IHostCsvInput[]): Promise<IHost[]> {
    try {
      const createdHosts: IHost[] = [];
      for await (const hostInput of hosts) {
        const hostInputObj: IHostInput = {
          ...hostInput,
          loadBalancer: Boolean(hostInput.loadBalancer),
          location: (await this.locationsModel.findOne({ name: hostInput.location }))._id,
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

  public async createNode({
    nodeInput,
    restart = true,
    createWebhook = true,
  }: INodeCreationProps): Promise<INode> {
    let id: string;
    const { https, ...rest } = nodeInput;
    const { fqdn } = await this.hostsModel.findOne({ _id: nodeInput.host });

    if (https && !fqdn) {
      throw new Error(`Node cannot use https with a host that does not have a FQDN.`);
    }

    try {
      const sanitizedInput = this.sanitizeCreate({ ...rest, port: Number(rest.port) });
      ({ id } = await this.nodesModel.create(sanitizedInput));

      const node = await this.getNode(id);

      if (createWebhook) {
        const discordService = await new DiscordService().init();

        if (sanitizedInput.frontend) {
          await discordService.addWebhookForFrontendNodes();
        } else {
          await discordService.createWebhooks({ nodes: [node], batch: false });
        }
      }

      if (restart) await this.restartMonitor();

      return node;
    } catch (error) {
      await this.nodesModel.deleteOne({ _id: id });
      throw error;
    }
  }

  public async createNodesCSV(nodes: INodeCsvInput[]): Promise<INode[]> {
    try {
      const createdNodes: INode[] = [];

      const discordService = await new DiscordService().init();

      for await (const nodeInput of nodes) {
        const host = await this.hostsModel.findOne({ name: nodeInput.host });
        const https = Boolean(nodeInput.https === 'true');
        const { fqdn, ip } = host;

        const nodeInputWithIds: INodeInput = {
          ...nodeInput,
          https,
          port: Number(nodeInput.port),
          chain: (await this.chainsModel.findOne({ name: nodeInput.chain }))._id,
          host: host._id,
          url: `http${https ? 's' : ''}://${fqdn || ip}:${nodeInput.port}`,
          loadBalancers: (
            await this.hostsModel.find({
              name: { $in: nodeInput.loadBalancers },
              loadBalancer: true,
            })
          ).map(({ _id }) => _id),
        };

        const node = await this.createNode({
          nodeInput: nodeInputWithIds,
          restart: false,
          createWebhook: false,
        });
        createdNodes.push(node);
      }

      /* Don't await the webhook creation as it takes a long time; let it run in the background. 
      Monitor is restarted in the Discord service when webhook creation is completed */
      discordService.createWebhooks({ nodes: createdNodes, batch: true });

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

    const { ip, fqdn, name } = (await this.hostsModel.findOne({
      _id: id,
    })) as IHost<false>;
    const newName = update.name && update.name !== name;
    const newIp = update.ip && update.ip !== ip;
    const newFqdn = update.fqdn && update.fqdn !== fqdn;

    /* If Host Name changes, all node names on that host will need to be updated */
    if (newName && (await this.nodesModel.exists({ host: id }))) {
      await this.updateNodeNamesIfHostNameChanges(id, update.name, name);
    }

    /* If Host IP or FQDN changes, all node URLs on that host will need to be updated */
    if ((newIp || newFqdn) && (await this.nodesModel.exists({ host: id }))) {
      await this.updateNodeUrlsIfHostDomainChanges(id, update);
    }
    if (ip && update.fqdn) {
      update.$unset = { ...update.$unset, ip: 1 };
    }
    if (fqdn && update.ip) {
      update.$unset = { ...update.$unset, fqdn: 1 };
    }

    await this.hostsModel.updateOne({ _id: id }, { ...update });
    if (restart) await this.restartMonitor();

    return await this.hostsModel.findOne({ _id: id }).populate('location').exec();
  }

  private async updateNodeNamesIfHostNameChanges(
    id: string,
    newHostName: string,
    oldHostName: string,
  ) {
    const nodesForHost = this.nodesModel.find({ host: id });

    for await (const { id, name } of nodesForHost) {
      const newNodeName = name.replace(oldHostName, newHostName);

      await this.nodesModel.updateOne({ _id: id }, { name: newNodeName });
    }
  }

  private async updateNodeUrlsIfHostDomainChanges(
    id: string,
    update: UpdateQuery<IHost>,
  ) {
    const nodesForHost = this.nodesModel.find({ host: id });

    for await (const node of nodesForHost) {
      const [protocol] = update.ip ? ['http'] : node.url.split('://');
      const newRootDomain = update.ip || update.fqdn;
      const newUrl = `${protocol}://${newRootDomain}:${node.port}`;

      await this.nodesModel.updateOne({ _id: node.id }, { url: newUrl });
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

    const { host, url, port } = (await this.nodesModel.findOne({
      _id: id,
    })) as INode<false>;
    const newHost = update.host !== host;

    /* If Node's fields change, the node's URL must be updated to reflect the changes */
    if (newHost) {
      const { fqdn, ip } = await this.hostsModel.findOne({ _id: host });
      update.url = `${fqdn || ip}:${port}`;
    }
    if (update.port) {
      update.url = (newHost ? update.url : url.split('://')[1]).replace(
        port.toString(),
        update.port,
      );
    }
    if (update.url) {
      const secure = typeof https === 'boolean' && https;
      update.url = `http${secure ? 's' : ''}://${update.url}`;
    }

    await this.nodesModel.updateOne({ _id: id }, update);
    if (restart) await this.restartMonitor();

    return await this.getNode(id);
  }

  public async deleteHost(id: string, restart = true): Promise<IHost> {
    const host = await this.hostsModel.findOne({ _id: id }).populate('location').exec();

    await this.hostsModel.deleteOne({ _id: id });
    if (restart) await this.restartMonitor();

    return host;
  }

  public async deleteNode(id: string, restart = true): Promise<INode> {
    const node = await this.getNode(id);

    await this.nodesModel.deleteOne({ _id: id });
    if (restart) await this.restartMonitor();

    return node;
  }

  public async deleteLocation(id: string): Promise<ILocation> {
    const location = await this.locationsModel.findOne({ _id: id });
    const locationHasHost = await this.hostsModel.exists({ location: id });
    if (locationHasHost) {
      throw new Error(
        `Location ${location.name} has one or more hosts; cannot be deleted.`,
      );
    }

    await this.locationsModel.deleteOne({ _id: id });

    return location;
  }

  private sanitizeCreate(unsanitizedCreate: { [key: string]: any }): UpdateQuery<any> {
    const input: UpdateQuery<any> = {};
    Object.entries(unsanitizedCreate).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== []) {
        input[key] = typeof value === 'string' ? value.trim() : value;
      }
    });
    return input;
  }

  private sanitizeUpdate(unsanitizedUpdate: { [key: string]: any }): UpdateQuery<any> {
    let update: UpdateQuery<any> = {};
    Object.entries(unsanitizedUpdate).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === []) {
        if (Object.keys(update).includes('$unset')) {
          update.$unset[key] = 1;
        } else {
          update.$unset = {};
          update.$unset[key] = 1;
        }
      } else {
        update[key] = typeof value === 'string' ? value.trim() : value;
      }
    });
    if (update.port) update = { ...update, port: Number(update.port) };
    return update;
  }

  /* ----- PNF Internal Only ----- */
  public async updateChain(update: IChainUpdate): Promise<IChain> {
    const { name: oldChainName } = await this.chainsModel.findOne({ _id: update.id });

    const { id, ...rest } = update;
    await this.chainsModel.updateOne({ _id: id }, rest);

    if (rest.name !== oldChainName && (await this.nodesModel.exists({ chain: id }))) {
      const nodesForChain = await this.nodesModel.find({ chain: id });
      for await (const node of nodesForChain) {
        const newNodeName = node.name.replace(oldChainName, rest.name);
        await this.nodesModel.updateOne({ _id: node.id }, { name: newNodeName });
      }
    }

    await this.restartMonitor();

    return await this.chainsModel.findOne({ _id: id });
  }

  public async updateOracle(update: IOracleUpdate): Promise<IOracle> {
    const { chain, urls } = update;
    await this.oraclesModel.updateOne({ chain }, { urls });

    await this.restartMonitor();

    return await this.oraclesModel.findOne({ chain });
  }

  /* ----- Health Check Methods ----- */
  async getHealthCheck(id: string): Promise<IHealthCheck> {
    const node = await this.nodesModel
      .findOne({ _id: id })
      .populate('host')
      .populate('chain')
      .exec();

    const healthService = new HealthService();
    const healthCheckParams = await healthService.getNodeOraclesAndPeers(node);
    const healthCheck = await healthService.checkNodeHealth(healthCheckParams);

    const { status, conditions, height, details, error } = healthCheck;
    const { status: nodeStatus, conditions: nodeConditions, deltaArray } = node;

    if (status !== nodeStatus || conditions !== nodeConditions) {
      await this.nodesModel.updateOne({ _id: id }, { status, conditions });
    }

    const updatedNodeHealth = { status, conditions, deltaArray: deltaArray };
    return { height, details, node: updatedNodeHealth as INode, error };
  }

  /* ----- Rotation Methods ----- */
  async addToRotation(id: string): Promise<boolean> {
    const { backend, server, host, chain, loadBalancers } = await this.getNode(id);

    await this.enableServer({ destination: backend, server, loadBalancers });

    return await this.alert.sendInfo({
      title: '[Manually Added to Rotation] - Success',
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
      title: '[Manually Removed from Rotation] - Success',
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
      const { fqdn, ip } = await this.hostsModel.findOne({ _id: host });

      return await this.getValidHaProxy({
        destination: frontend,
        frontendUrl: fqdn || ip,
      });
    } else if (backend) {
      const loadBalancers = await this.hostsModel.find({ _id: { $in: loadBalancerIds } });

      return await this.getValidHaProxy({ destination: backend, loadBalancers });
    }
  }

  async muteMonitor(id: string): Promise<INode> {
    await this.nodesModel.updateOne({ _id: id }, { muted: true }).exec();
    await this.restartMonitor();
    return await this.getNode(id);
  }

  async unmuteMonitor(id: string): Promise<INode> {
    await this.nodesModel.updateOne({ _id: id }, { muted: false });
    await this.restartMonitor();
    return await this.getNode(id);
  }

  async restartMonitor(): Promise<boolean> {
    try {
      return await new Promise((resolve, reject) => {
        exec('pm2 restart monitor', (error, stdout) => {
          if (error) reject(`error: ${error.message}`);
          resolve(!!stdout);
        });
      });
    } catch (error) {
      console.log('Cannot restart monitor, monitor not running.');
    }
  }
}
