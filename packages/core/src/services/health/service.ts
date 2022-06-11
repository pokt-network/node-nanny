import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { exec } from 'child_process';
import { FilterQuery, Types } from 'mongoose';

import { INode, ChainsModel, NodesModel, OraclesModel } from '../../models';
import {
  EErrorConditions,
  EErrorStatus,
  ENCResponse,
  ESupportedBlockchains,
  ESupportedBlockchainTypes,
  IBlockHeight,
  IHealthResponse,
  IHealthResponseDetails,
  IHealthResponseParams,
  INodeCheckParams,
  IOraclesResponse,
  IRefHeight,
  IRPCCheckParams,
  IRPCMethodParams,
  IRPCResult,
} from './types';
import { colorLog, hexToDec } from '../../utils';
import env from '../../environment';

export class Service {
  private rpc: AxiosInstance;

  constructor() {
    this.rpc = this.initClient();
  }

  private initClient(): AxiosInstance {
    const headers = { 'Content-Type': 'application/json' };
    const client = axios.create({ timeout: 10000, headers });
    axiosRetry(client, { retries: 3 });
    return client;
  }

  private getAxiosRequestConfig(auth: string): AxiosRequestConfig {
    if (auth) {
      const [username, password] = auth.split(':');
      return { auth: { username, password } };
    }
  }

  private rpcMethodTemplates: {
    [key: string]: (params: IRPCMethodParams) => Promise<AxiosResponse<IRPCResult>>;
  } = {
    get: async ({ fullRpcUrl, basicAuth }) =>
      this.rpc.get(fullRpcUrl, this.getAxiosRequestConfig(basicAuth)),
    post: async ({ fullRpcUrl, basicAuth, rpc }) =>
      this.rpc.post(fullRpcUrl, rpc, this.getAxiosRequestConfig(basicAuth)),
  };

  /** Health Check Call - This is the main method that checks the health of any node for any chain. 
  Chain-specific parameters are stored in the database to enable this method to be chain-agnostic. */
  async checkNodeHealth(node: INode): Promise<IHealthResponse> {
    const { name, chain, host, port } = node;
    const { allowance, hasOwnEndpoint, healthyValue, responsePath } = chain;

    const isNodeListening = await this.isNodeListening({
      host: host.fqdn || host.ip,
      port,
    });
    if (!isNodeListening) {
      return this.healthResponse[EErrorConditions.OFFLINE]({ name });
    }

    let rpcResponse: AxiosResponse<IRPCResult>;
    try {
      rpcResponse = await this.checkNodeRPC(node);
    } catch (error) {
      return this.healthResponse[EErrorConditions.NO_RESPONSE]({ name, error });
    }

    if (hasOwnEndpoint) {
      const nodeIsHealthy = this.checkHealthCheckField(
        rpcResponse,
        responsePath,
        healthyValue,
      );
      const { data } = rpcResponse;
      const { result } = data || {};

      return nodeIsHealthy
        ? this.healthResponse[EErrorConditions.HEALTHY]({ name, result })
        : this.healthResponse[EErrorConditions.NOT_SYNCHRONIZED]({ name, result });
    } else {
      try {
        const refHeightValues = await this.getReferenceBlockHeight(node);
        const { refHeight, badOracles, noOracle } = refHeightValues;
        const nodeHeight = this.getBlockHeightField(rpcResponse, responsePath);

        const delta = refHeight - nodeHeight;
        const height: IBlockHeight = {
          internalHeight: nodeHeight,
          externalHeight: refHeight,
          delta,
        };

        const nodeIsAheadOfPeer = delta + allowance < 0;
        if (nodeIsAheadOfPeer) {
          return this.healthResponse[EErrorConditions.PEER_NOT_SYNCHRONIZED]({
            name,
            height,
          });
        }

        const notSynced = this.checkNodeNotSynced(delta, allowance, rpcResponse.data);
        if (notSynced) {
          const secondsToRecover = await this.updateNotSynced(delta, node.id.toString());
          return this.healthResponse[EErrorConditions.NOT_SYNCHRONIZED]({
            name,
            height,
            secondsToRecover,
            badOracles,
            noOracle,
          });
        }

        /* HEALTHY Node Response */
        return this.healthResponse[EErrorConditions.HEALTHY]({
          name,
          height,
          badOracles,
          noOracle,
        });
      } catch (error) {
        const noPeers = error === EErrorConditions.NO_PEERS;
        if (noPeers) return this.healthResponse[EErrorConditions.NO_PEERS]({ name });

        const timeout = String(error).includes(`Error: timeout of`);
        if (timeout) {
          return this.healthResponse[EErrorConditions.NO_RESPONSE]({ name, error });
        }

        throw error;
      }
    }
  }

  /** ---- Private health check methods ---- */

  /** Performs a netcat call to the node to determine if it is online */
  private async isNodeListening({ host, port }: INodeCheckParams): Promise<boolean> {
    try {
      const nc = await new Promise<string>((resolve, reject) => {
        exec(`nc -vz -q 2 ${host} ${port}`, (error, stdout, stderr) => {
          if (error) reject(`error: ${error.message}`);
          if (stderr) resolve(stderr);

          resolve(stdout);
        });
      });
      let status = nc.split(' ');
      return status[status.length - 1].includes(ENCResponse.SUCCESS);
    } catch (error) {
      return false;
    }
  }

  /** Returns a response from the Node to determine if the Node is responding.
   * The shape of this response varies depending on the Chain. */
  private async checkNodeRPC({
    chain,
    url,
    basicAuth,
  }: IRPCCheckParams): Promise<AxiosResponse<IRPCResult>> {
    const { endpoint, rpc } = chain;

    const method = !!rpc ? 'post' : 'get';
    const parsedRpc = !!rpc ? JSON.parse(rpc) : null;
    const fullRpcUrl = `${url}${endpoint || ''}`;

    const rpcMethod = this.rpcMethodTemplates[method];
    return rpcMethod({ fullRpcUrl, basicAuth, rpc: parsedRpc });
  }

  /** Only used if `chain.hasOwnEndpoint` is true */
  private checkHealthCheckField(
    response: AxiosResponse,
    healthCheckPath: string,
    healthyValue: string,
  ): boolean {
    const healthCheckField = this.resolvePath(response, healthCheckPath);
    return Boolean(healthCheckField === this.getHealthyValueType(healthyValue));
  }

  /** Only used if `chain.hasOwnEndpoint` is false */
  private getBlockHeightField(response: AxiosResponse, blockHeightPath: string): number {
    const blockHeightField = this.resolvePath(response, blockHeightPath);
    return hexToDec(blockHeightField);
  }

  /** Only used if `chain.hasOwnEndpoint` is false. Gets the highest block height among
   * reference URLs for the node. Ref URLS are either external oracles or node peers.  */
  private async getReferenceBlockHeight(node: INode): Promise<IRefHeight> {
    const { chain } = node;
    const { useOracles } = chain;

    let refHeights: number[] = [];
    let badOraclesArray: string[];
    let noOracle: boolean;

    if (useOracles) {
      const { oracleHeights, badOracles } = await this.getOracleBlockHeights(node);
      refHeights = oracleHeights;
      if (badOracles?.length) badOraclesArray = badOracles;
    }
    if (!useOracles || refHeights.length < 2) {
      const peerHeights = await this.getPeerBlockHeights(node);

      if (!refHeights.length && peerHeights.length < 2) {
        throw EErrorConditions.NO_PEERS;
      } else if (useOracles && !refHeights.length) {
        noOracle = true;
      }

      refHeights = [...refHeights, ...peerHeights];
    }

    const blockHeightVal: IRefHeight = { refHeight: this.getHighestHeight(refHeights) };
    if (badOraclesArray) blockHeightVal.badOracles = badOraclesArray;
    if (noOracle) blockHeightVal.noOracle = noOracle;
    return blockHeightVal;
  }

  private getHighestHeight(blockHeights: number[]): number {
    const [highestBlockHeight] = blockHeights.sort((a, b) => b - a);
    return highestBlockHeight;
  }

  /** Only used if `chain.useOracles` is true. Will return up to 2 block heights from healthy oracles. */
  private async getOracleBlockHeights(node: INode): Promise<IOraclesResponse> {
    const { chain, basicAuth } = node;
    const { name, responsePath } = chain;
    const { urls: oracleUrls } = await OraclesModel.findOne({ chain: name });

    let oracleHeights: number[] = [];
    let badOracles: string[] = [];

    for await (const url of oracleUrls) {
      try {
        const blockHeightRes = await this.checkNodeRPC({ chain, url, basicAuth });
        const blockHeightField = this.getBlockHeightField(blockHeightRes, responsePath);

        oracleHeights.push(blockHeightField);
        if (oracleHeights.length >= 2) break;
      } catch (error) {
        badOracles.push(url);
      }
    }

    return { oracleHeights, badOracles };
  }

  /** Only used if `chain.useOracles` is false or <2 healthy Oracles can be called for node.
  Will sample up to 20 random peers for node and return their block heights. */
  private async getPeerBlockHeights(node: INode): Promise<number[]> {
    const { id: nodeId, chain, name: nodeName, basicAuth } = node;
    const { id: chainId, responsePath, type } = chain;
    const pnfInternal = env('PNF') && type === ESupportedBlockchainTypes.POKT;

    let chainQuery: FilterQuery<INode>;
    if (type === ESupportedBlockchainTypes.POKT) {
      const poktChains = await ChainsModel.find({
        type: ESupportedBlockchainTypes.POKT,
        name: { $ne: ESupportedBlockchains['POKT-TEST'] }, // Temp until testnet monitor fixed
      });
      const poktChainIds = poktChains.map(({ _id }) => new Types.ObjectId(_id));
      chainQuery = { $in: poktChainIds };
    } else {
      chainQuery = new Types.ObjectId(chainId);
    }

    const $match: FilterQuery<INode> = {
      chain: chainQuery,
      _id: { $ne: new Types.ObjectId(nodeId) },
      frontend: null,
    };
    if (pnfInternal) $match.status = { $ne: EErrorStatus.ERROR };
    const $sample = { size: 20 };

    const peers = await NodesModel.aggregate<INode>([{ $match }, { $sample }]);
    const peerUrls = peers.map(({ url }) => url);

    let peerHeights: number[] = [];
    for await (const url of peerUrls) {
      try {
        const blockHeightRes = await this.checkNodeRPC({ chain, url, basicAuth });
        const blockHeightField = this.getBlockHeightField(blockHeightRes, responsePath);
        peerHeights.push(blockHeightField);
      } catch (error) {
        colorLog(`Error getting peer blockHeight: ${nodeName} ${url} ${error}`, 'yellow');
      }
    }

    return peerHeights;
  }

  /** Simple boolean to check if delta over allowance or response contains an error code */
  private checkNodeNotSynced(
    delta: number,
    allowance: number,
    response: IRPCResult,
  ): boolean {
    return Boolean(delta > allowance || response.error?.code);
  }

  /** Gets the stored healthy value type from its string representation in the DB */
  private getHealthyValueType(stringValue: string): string | number | boolean {
    try {
      return JSON.parse(stringValue.toLowerCase());
    } catch {
      return stringValue.toString();
    }
  }

  /** Gets an object value from a period-delimited string path. eg. "data.result.healthy" */
  private resolvePath = (response: AxiosResponse, path: string) =>
    path.split('.').reduce((p, c) => (p && p[c]) ?? null, response);

  /** ---- IHealthResponse object creation methods ---- */
  private healthResponse: {
    [condition in EErrorConditions]: (params: IHealthResponseParams) => IHealthResponse;
  } = {
    [EErrorConditions.HEALTHY]: (params) => this.getHealthy(params),
    [EErrorConditions.OFFLINE]: (params) => this.getOffline(params),
    [EErrorConditions.NO_RESPONSE]: (params) => this.getNoResponse(params),
    [EErrorConditions.NOT_SYNCHRONIZED]: (params) => this.getNotSynced(params),
    [EErrorConditions.NO_PEERS]: (params) => this.getNoPeers(params),
    [EErrorConditions.PEER_NOT_SYNCHRONIZED]: (params) => this.getPeersNotSynced(params),
    [EErrorConditions.PENDING]: null, // PENDING only used as initial status, not response.
  };

  private getHealthy = ({
    name,
    result,
    height,
    badOracles,
    noOracle,
  }: IHealthResponseParams): IHealthResponse => {
    const healthResponse: IHealthResponse = {
      name,
      status: EErrorStatus.OK,
      conditions: EErrorConditions.HEALTHY,
      health: result || 'Node is healthy.',
    };

    if (height) healthResponse.height = height;
    const details: IHealthResponseDetails = {};
    if (badOracles) details.badOracles = badOracles;
    if (noOracle) details.noOracle = noOracle;
    if (Object.keys(details).length) healthResponse.details = details;

    return healthResponse;
  };

  private getOffline = ({ name }: IHealthResponseParams): IHealthResponse => ({
    name,
    status: EErrorStatus.ERROR,
    conditions: EErrorConditions.OFFLINE,
  });

  private getNoResponse = ({ name, error }: IHealthResponseParams): IHealthResponse => ({
    name,
    status: EErrorStatus.ERROR,
    conditions: EErrorConditions.NO_RESPONSE,
    error: error.message,
  });

  private getNotSynced = ({
    name,
    result,
    height,
    secondsToRecover,
    badOracles,
    noOracle,
  }: IHealthResponseParams): IHealthResponse => {
    const healthResponse: IHealthResponse = {
      name,
      status: EErrorStatus.ERROR,
      conditions: EErrorConditions.NOT_SYNCHRONIZED,
      health: result || 'Node is out of sync.',
    };

    if (height) healthResponse.height = height;
    const details: IHealthResponseDetails = {};
    if (secondsToRecover) details.secondsToRecover = secondsToRecover;
    if (badOracles) details.badOracles = badOracles;
    if (noOracle) details.noOracle = noOracle;
    if (Object.keys(details).length) healthResponse.details = details;

    return healthResponse;
  };

  private getNoPeers = ({ name }: IHealthResponseParams): IHealthResponse => ({
    name,
    status: EErrorStatus.ERROR,
    conditions: EErrorConditions.NO_PEERS,
  });

  private getPeersNotSynced = ({
    name,
    height,
  }: IHealthResponseParams): IHealthResponse => ({
    name,
    status: EErrorStatus.ERROR,
    conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
    height,
    details: { nodeIsAheadOfPeer: Math.abs(height.delta) },
  });

  /* Estimate Seconds to Recover for Not Synced - Nodes that use oracles or peers only */

  /** Updates the Node's time to recover fields if it's not synced.
   * When the node becomes healthy again, deltaArray and secondsToRecover
   * are reset inside the Event service */
  private async updateNotSynced(delta: number, nodeId: string): Promise<number> {
    const { deltaArray } = await NodesModel.findOne({ _id: nodeId })
      .select('deltaArray')
      .exec();
    const newDeltaArray = this.getDeltaArray(delta, deltaArray);

    await NodesModel.updateOne({ _id: nodeId }, { deltaArray: newDeltaArray });

    return this.getSecondsToRecover(newDeltaArray);
  }

  /** Saves the last X recorded block heights to the node model if not synced */
  private getDeltaArray(delta: number, deltaArray: number[]): number[] {
    if (deltaArray?.length >= env('ALERT_RETRIGGER_THRESHOLD')) deltaArray.shift();
    return deltaArray?.length ? [...deltaArray, delta] : [delta];
  }

  /** Gets an estimated time to recover based on delta / average delta reduction per interval * # of intervals */
  private getSecondsToRecover(deltaArray: number[]): number {
    if (deltaArray?.length < env('ALERT_TRIGGER_THRESHOLD')) return null;

    const newestDelta = deltaArray[deltaArray.length - 1];
    const [oldestDelta] = deltaArray;

    /* If delta is stuck return 0 */
    if (newestDelta === oldestDelta) {
      return 0;
    }

    const diffArray = deltaArray.map((delta, i, a) => delta - a[i + 1]).slice(0, -1);
    const avgDeltaReduction = diffArray.reduce((sum, d) => sum + d) / diffArray.length;

    /* If delta is increasing return -1 */
    if (avgDeltaReduction < 0) {
      return -1;
    }

    /* Calculate estimated time to recover in seconds */
    const numIntervals = newestDelta / avgDeltaReduction;
    const secondsToRecover = Math.ceil(numIntervals * (env('MONITOR_INTERVAL') / 1000));

    return secondsToRecover;
  }
}
