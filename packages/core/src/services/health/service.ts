import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { exec } from 'child_process';
import { FilterQuery, Types } from 'mongoose';
import util from 'util';

import { IChain, INode, ChainsModel, NodesModel, OraclesModel } from '../../models';
import {
  EErrorConditions,
  EErrorStatus,
  ENCResponse,
  ESupportedBlockchainTypes,
  IBlockHeight,
  IHealthResponse,
  IHealthResponseDetails,
  IHealthResponseParams,
  IEVMHealthCheckOptions,
  IOraclesResponse,
  IPocketBlockHeight,
  IRefHeight,
  IReferenceURL,
  IRPCResponse,
} from './types';
import { colorLog, hexToDec } from '../../utils';
import env from '../../environment';

// TEMP TYPES
interface IRPCMethodParams {
  fullRpcUrl: string;
  basicAuth?: string;
  rpc?: { jsonrpc: string; id: number; method: string; params?: any[] };
}

interface IRPCResult {
  // DEV NOTE -> Need to type fully per chain
  jsonrpc: string;
  id: number;
  result?:
    | string // ALG, SOL
    | number
    | { healthy?: boolean } // AVAX
    | { sync_info: { catching_up: boolean } }; // TMT
  error?: { code: number; message: string };
}
// TEMP TYPES

//TEMP UTIL FUNCTIONS
const resolvePath = <T = any>(response: AxiosResponse<T>, path: string) =>
  path.split('.').reduce((p, c) => (p && p[c]) ?? null, response);
//TEMP UTIL FUNCTIONS

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

  /* ----- DEVELOPMENT - Chain Agnostic Health Check Methods - DEVELOPMENT ----- 
  Database parameters needed per-chain:
  - chain.method - string - RPC endpoint method: GET, POST, etc.
  - chain.endpoint - string - Endpoint path: /health, /ext/health, /status, etc.
  - chain.rpc - RPC body (if POST request)
  - chain.hasOwnEndpoint - boolean - Whether Chain has its own health endpoint (if not, proceed to next step - useOracles)
  - chain.useOracles - boolean - Whether Chain has external Oracles (currently only EVM does). If not (current only POKT), will use peers for reference nodes.
  - chain.responsePath - string - Chain health check RPC response field path - example: "status" or "data.result.healthy"
  - chain.blockHeightPath - string - Chain block height RPC response field path - example: "data.result" or "data.result.sync_info.latest_block_height"
  - chain.healthyValue - boolean | number | string - The field contents that signify a healthy response from the chain's API
  
  Questions Currently?
  1. Do we still need to check OFFLINE status or is NO_RESPONSE check sufficient (EVM chains only)? YES
  2. Do we still need to fetch number of peers and ethSyncing (EVM chains only)? NO
  */

  /** Health Check Call - This is the main method that checks the health of any node for any chain. 
  Chain-specific parameters are stored in the database to enable this method to be chain-agnostic. */
  async checkNodeHealth(node: any /* INode */): Promise<IHealthResponse> {
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
      const { result } = data;

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

  private rpcMethodTemplates: {
    [key: string]: <T>(params: IRPCMethodParams) => Promise<AxiosResponse<T>>;
  } = {
    get: async ({ fullRpcUrl, basicAuth }) =>
      this.rpc.get(fullRpcUrl, this.getAxiosRequestConfig(basicAuth)),
    post: async ({ fullRpcUrl, basicAuth, rpc }) =>
      this.rpc.post(fullRpcUrl, rpc, this.getAxiosRequestConfig(basicAuth)),
  };

  private async isNodeListening({ host, port }): Promise<boolean> {
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
  private async checkNodeRPC(
    { chain, url, basicAuth }: any /* INode */,
  ): Promise<AxiosResponse<IRPCResult>> {
    const { method, endpoint, rpc } = chain;

    const fullRpcUrl = `${url}${endpoint || ''}`;
    const rpcMethod = this.rpcMethodTemplates[method];
    return rpcMethod<IRPCResult>({ fullRpcUrl, basicAuth, rpc });
  }

  /** Only used if `chain.hasOwnEndpoint` is true */
  private checkHealthCheckField(
    response: AxiosResponse,
    healthCheckPath: string,
    healthyValue: string | number | boolean,
  ): boolean {
    const healthCheckField = resolvePath(response, healthCheckPath);
    return Boolean(healthCheckField === healthyValue);
  }

  private checkNodeNotSynced(
    delta: number,
    allowance: number,
    response: IRPCResult,
  ): boolean {
    return Boolean(delta > allowance || response.error?.code);
  }

  /** Only used if `chain.hasOwnEndpoint` is false */
  private getBlockHeightField(response: AxiosResponse, blockHeightPath: string): number {
    const blockHeightField = resolvePath(response, blockHeightPath);
    return hexToDec(blockHeightField);
  }

  /** Only used if `chain.hasOwnEndpoint` is false. Gets the highest block height among
   * reference URLs for the node. Ref URLS are either external oracles or node peers.  */
  private async getReferenceBlockHeight(node: any /* INode */): Promise<IRefHeight> {
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

      if (peerHeights.length < 2) {
        throw EErrorConditions.NO_PEERS;
      } else if (!refHeights.length) {
        noOracle = true;
      }

      refHeights = [...refHeights, ...peerHeights];
    }

    const blockHeightVal: IRefHeight = { refHeight: this.sortBlockHeights(refHeights) };
    if (badOraclesArray) blockHeightVal.badOracles = badOraclesArray;
    if (noOracle) blockHeightVal.noOracle = noOracle;
    return blockHeightVal;
  }

  private sortBlockHeights(blockHeights: number[]): number {
    const [highestBlockHeight] = blockHeights.sort((a, b) => b - a);
    return highestBlockHeight;
  }

  /** Only used if `chain.useOracles` is true. Will return up to 2 block heights from healthy oracles. */
  private async getOracleBlockHeights(node: any /* INode */): Promise<IOraclesResponse> {
    const { chain } = node;
    const { name, responsePath } = chain;
    const { urls: oracleUrls } = await OraclesModel.findOne({ chain: name });

    let oracleHeights: number[] = [];
    let badOracles: string[] = [];

    for await (const oracleUrl of oracleUrls) {
      try {
        const blockHeightRes = await this.checkNodeRPC({ ...node, url: oracleUrl });
        const blockHeightField = this.getBlockHeightField(blockHeightRes, responsePath);

        oracleHeights.push(blockHeightField);
        if (oracleHeights.length >= 2) break;
      } catch {
        badOracles.push(oracleUrl);
      }
    }

    return { oracleHeights, badOracles };
  }

  /** Only used if `chain.useOracles` is false or <2 healthy Oracles can be called for node.
  Will sample up to 20 random peers for node and return their block heights. */
  private async getPeerBlockHeights(node: any /* INode */): Promise<number[]> {
    const { id: nodeId, chain, name: nodeName } = node;
    const { id: chainId, responsePath, type } = chain;

    let chainQuery: FilterQuery<INode>;
    if (env('PNF') && type === ESupportedBlockchainTypes.POKT) {
      const poktChains = await ChainsModel.find({ type: ESupportedBlockchainTypes.POKT });
      const poktChainIds = poktChains.map(({ _id }) => _id);
      chainQuery = { $in: poktChainIds };
    } else {
      chainQuery = chainId;
    }

    const status = { $ne: EErrorStatus.ERROR };
    const $match = { chain: chainQuery, _id: { $ne: nodeId }, status };
    const $sample = { size: 20 };
    const peers = await NodesModel.aggregate<INode>([{ $match }, { $sample }]);
    const peerUrls = peers.map(({ url }) => url);

    let peerHeights: number[] = [];
    for await (const peerUrl of peerUrls) {
      try {
        const blockHeightRes = await this.checkNodeRPC({ ...node, url: peerUrl });
        const blockHeightField = this.getBlockHeightField(blockHeightRes, responsePath);
        peerHeights.push(blockHeightField);
      } catch (error) {
        colorLog(`Error getting blockHeight: ${nodeName} ${peerUrl} ${error}`, 'yellow');
      }
    }

    return peerHeights;
  }

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

  /* End of Development logic for Chain-Agnostic Health Check
















  
  */
  /*  OLD HEALTH CHECKS - WILL BE REMOVED 
  ----- Node Health Check Public Method ----- */
  public async getNodeHealth(node: INode): Promise<IHealthResponse> {
    const { chain } = node;
    if (!Object.keys(ESupportedBlockchainTypes).includes(chain.type)) {
      throw new Error(`${chain.type} is not a supported chain type`);
    }

    return this.healthCheckMethods[chain.type](node);
  }

  private healthCheckMethods: {
    [chainType in ESupportedBlockchainTypes]: (node: INode) => Promise<IHealthResponse>;
  } = {
    ALG: (node) => this.getAlgorandNodeHealth(node),
    AVA: (node) => this.getAvaNodeHealth(node),
    EVM: (node) => this.getEVMNodeHealth(node),
    HMY: (node) => this.getHarmonyNodeHealth(node),
    POKT: (node) => this.getPocketNodeHealth(node),
    SOL: (node) => this.getSolNodeHealth(node),
    TMT: (node) => this.getTendermintNodeHealth(node),
    NEAR: (node) => this.getNEARNodeHealth(node),
  };

  /* ----- Algorand ----- */
  private getAlgorandNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    const { name, url, basicAuth } = node;

    try {
      const { data, status } = await this.rpc.get(
        `${url}/health`,
        this.getAxiosRequestConfig(basicAuth),
      );

      if (status === 200) {
        return {
          name,
          conditions: EErrorConditions.HEALTHY,
          status: EErrorStatus.OK,
        };
      } else {
        return {
          name,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          status: EErrorStatus.ERROR,
          health: data?.result || [],
        };
      }
    } catch (error) {
      return {
        name,
        conditions: EErrorConditions.NO_RESPONSE,
        status: EErrorStatus.ERROR,
        health: error,
      };
    }
  };

  /* ----- Avalanche ----- */
  private getAvaNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    const { name, url, basicAuth } = node;

    try {
      const { data } = await this.rpc.post(
        `${url}/ext/health`,
        { jsonrpc: '2.0', id: 1, method: 'health.health' },
        this.getAxiosRequestConfig(basicAuth),
      );

      const { result } = data;
      if (result.healthy) {
        return {
          name,
          conditions: EErrorConditions.HEALTHY,
          status: EErrorStatus.OK,
          health: result,
        };
      } else {
        return {
          name,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          status: EErrorStatus.ERROR,
          health: result,
        };
      }
    } catch (error) {
      return {
        name,
        conditions: EErrorConditions.NO_RESPONSE,
        status: EErrorStatus.ERROR,
        health: error,
      };
    }
  };

  /* ----- Ethereum Virtual Machine ----- */
  private getEVMNodeHealth = async (
    node: INode,
    { harmony }: IEVMHealthCheckOptions = { harmony: false },
  ): Promise<IHealthResponse> => {
    const { name, chain, url, host, port, basicAuth } = node;
    const { allowance } = chain;

    let healthResponse: IHealthResponse = {
      name,
      status: EErrorStatus.OK,
      conditions: EErrorConditions.HEALTHY,
    };

    /* Check if node is online and RPC up */
    const isNodeListening = await this.isNodeListening({
      host: host.fqdn || host.ip,
      port,
    });
    if (!isNodeListening) {
      return {
        ...healthResponse,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.OFFLINE,
      };
    }
    const isRpcResponding = await this.isRpcResponding({ url }, basicAuth, harmony);
    if (!isRpcResponding) {
      return {
        ...healthResponse,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_RESPONSE,
      };
    }

    /* Check for required number of Oracles and/or Peers */
    let referenceUrls: IReferenceURL[];
    const { healthyOracles, badOracles } = await this.getOracles(chain);
    if (healthyOracles.length >= 2) {
      referenceUrls = healthyOracles;
    } else {
      const healthyPeers = await this.getPeers(chain, node.id);
      if (!healthyOracles.length && healthyPeers.length < 2) {
        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NO_PEERS,
        };
      } else if (!healthyOracles.length && healthyPeers.length >= 2) {
        healthResponse = {
          ...healthResponse,
          details: { noOracle: true, numPeers: healthyPeers.length },
        };
      }
      referenceUrls = [...healthyOracles, ...healthyPeers];
    }

    if (badOracles.length) {
      healthResponse = {
        ...healthResponse,
        details: {
          ...healthResponse.details,
          badOracles: badOracles.map(({ url }) => url),
        },
      };
    }

    try {
      /* Get node's block height, highest block height from reference nodes and ethSyncing object */
      const [internalBh, externalBh /*ethSyncing*/] = await Promise.all([
        this.getBlockHeight(url, basicAuth, harmony),
        this.getReferenceBlockHeightOLD(referenceUrls, allowance, harmony),
        // this.getEthSyncing(url, basicAuth),
      ]);

      // const { result } = await this.getExternalPeers(url, basicAuth);
      // const numPeers = hexToDec(result);
      const nodeHeight = hexToDec(internalBh.result);
      const peerHeight = externalBh;

      /* Compare highest ref height with node's height */
      const delta = peerHeight - nodeHeight;
      const nodeIsAheadOfPeer = delta + allowance < 0;
      const height = { internalHeight: nodeHeight, externalHeight: peerHeight, delta };

      if (nodeIsAheadOfPeer) {
        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
          height,
          details: { ...healthResponse.details, nodeIsAheadOfPeer: Math.abs(delta) },
        };
      }

      // Not synced response
      if (delta > allowance || internalBh.error?.code) {
        const secondsToRecover = await this.updateNotSynced(delta, node.id.toString());
        if (secondsToRecover !== null) {
          healthResponse = {
            ...healthResponse,
            details: { ...healthResponse.details, secondsToRecover },
          };
        }

        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          health: internalBh.error?.code ? internalBh : null,
          height,
        };
      }

      // Healthy response
      return { ...healthResponse, height };
    } catch (error) {
      const isTimeout = String(error).includes(`Error: timeout of 1000ms exceeded`);
      if (isTimeout) {
        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NO_RESPONSE,
        };
      }
    }

    return {
      ...healthResponse,
      status: EErrorStatus.ERROR,
      conditions: EErrorConditions.NO_RESPONSE,
    };
  };

  private async nc({ host, port }): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`nc -vz -q 2 ${host} ${port}`, (error, stdout, stderr) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        if (stderr) {
          resolve(stderr);
        }
        resolve(stdout);
      });
    });
  }

  private async isRpcResponding(
    { url },
    auth?: string,
    harmony?: boolean,
  ): Promise<boolean> {
    try {
      await this.getBlockHeight(url, auth, harmony);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getOracles({ name }: IChain): Promise<any> {
    const { urls } = await OraclesModel.findOne({ chain: name });

    const { healthyUrls: healthyOracles, badUrls: badOracles } =
      await this.checkRefUrlHealth(urls.map((url) => ({ url })));

    return { healthyOracles, badOracles };
  }

  private async getPeers(
    { id: chainId }: IChain,
    nodeId: Types.ObjectId,
  ): Promise<IReferenceURL[]> {
    const peers = await NodesModel.find({ chain: chainId, _id: { $ne: nodeId } });
    const { healthyUrls: healthyPeers } = await this.checkRefUrlHealth(
      peers.map(({ url, basicAuth: auth }) => ({ url, auth })),
    );

    return healthyPeers;
  }

  private async checkRefUrlHealth(
    urls: IReferenceURL[],
  ): Promise<{ healthyUrls: IReferenceURL[]; badUrls: IReferenceURL[] }> {
    const healthyUrls: IReferenceURL[] = [];
    const badUrls: IReferenceURL[] = [];

    for await (const { url, auth } of urls) {
      (await this.isRpcResponding({ url }, auth))
        ? healthyUrls.push({ url, auth })
        : badUrls.push({ url, auth });
    }

    return { healthyUrls, badUrls };
  }

  private async getBlockHeight(
    url: string,
    auth?: string,
    harmony?: boolean,
  ): Promise<IRPCResponse> {
    const method = harmony ? 'hmyv2_blockNumber' : 'eth_blockNumber';

    try {
      const { data } = await this.rpc.post<IRPCResponse>(
        url,
        { jsonrpc: '2.0', id: 1, method, params: [] },
        this.getAxiosRequestConfig(auth),
      );
      return data;
    } catch (error) {
      const stringError = JSON.stringify(error);
      throw new Error(`getBlockHeight contact blockchain node ${stringError} ${url}`);
    }
  }

  private async getReferenceBlockHeightOLD(
    endpoints: IReferenceURL[],
    _allowance: number,
    harmony: boolean,
  ): Promise<number> {
    const resolved = await Promise.all(
      endpoints.map(({ url, auth }) => this.getBlockHeight(url, auth, harmony)),
    );

    const readings = resolved
      .filter((reading) => reading.result)
      .map(({ result }) => hexToDec(result));
    return readings.sort((a, b) => b - a)[0];
  }

  // private async getEthSyncing(
  //   url: string,
  //   auth?: string,
  //   harmony?: boolean,
  // ): Promise<string> {
  //   const method = harmony ? 'hmyv2_syncing' : 'eth_syncing';
  //   try {
  //     const { data } = await this.rpc.post<IRPCSyncResponse>(
  //       url,
  //       { jsonrpc: '2.0', id: 1, method, params: [] },
  //       this.getAxiosRequestConfig(auth),
  //     );
  //     return Object.entries(data.result)
  //       .map(([key, value]) => {
  //         const syncValue = key.toLowerCase().includes('hash') ? value : hexToDec(value);
  //         return `${camelToTitle(key)}: ${syncValue}`;
  //       })
  //       .join(' / ');
  //   } catch (error) {
  //     throw new Error(`getEthSyncing could not contact blockchain node ${error} ${url}`);
  //   }
  // }

  // private async getExternalPeers(url: string, auth?: string): Promise<IRPCResponse> {
  //   try {
  //     const { data } = await this.rpc.post<IRPCResponse>(
  //       url,
  //       { jsonrpc: '2.0', id: 1, method: 'net_peerCount', params: [] },
  //       this.getAxiosRequestConfig(auth),
  //     );
  //     return data;
  //   } catch (error) {
  //     throw new Error(
  //       `getExternalPeers could not contact blockchain node ${error} ${url}`,
  //     );
  //   }
  // }

  /* ----- Harmony ----- */
  private getHarmonyNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    return await this.getEVMNodeHealth(node, { harmony: true });
  };

  /* ----- Near ----- */
  private async getNEARBlockHeight(url: string, auth?: string) {
    try {
      const { data } = await this.rpc.post(
        url,
        {
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'status',
          params: [],
        },
        this.getAxiosRequestConfig(auth),
      );
      return data.result.sync_info.latest_block_height;
    } catch (error) {
      const stringError = JSON.stringify(error);
      throw new Error(
        `getBlockHeight could not contact blockchain node ${stringError} ${url}`,
      );
    }
  }

  private getNEARNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    const { name, chain, url, host, port, basicAuth } = node;
    const { allowance } = chain;

    let healthResponse: IHealthResponse = {
      name,
      status: EErrorStatus.OK,
      conditions: EErrorConditions.HEALTHY,
    };

    /* Check if node is online and RPC up */
    const isNodeListening = await this.isNodeListening({
      host: host.fqdn || host.ip,
      port,
    });
    if (!isNodeListening) {
      return {
        ...healthResponse,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.OFFLINE,
      };
    }
    const NEARBlockHeight = await this.getNEARBlockHeight(url, basicAuth);
    if (!NEARBlockHeight) {
      return {
        ...healthResponse,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_RESPONSE,
      };
    }
    let referenceUrls: IReferenceURL[];
    const { healthyOracles, badOracles } = await this.getOracles(chain);
    if (healthyOracles.length >= 1) {
      referenceUrls = healthyOracles;
    } else {
      const healthyPeers = await this.getPeers(chain, node.id);
      if (!healthyOracles.length && healthyPeers.length < 2) {
        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NO_PEERS,
        };
      } else if (!healthyOracles.length && healthyPeers.length >= 2) {
        healthResponse = {
          ...healthResponse,
          details: { noOracle: true, numPeers: healthyPeers.length },
        };
      }
      referenceUrls = [...healthyOracles, ...healthyPeers];
    }

    if (badOracles.length) {
      healthResponse = {
        ...healthResponse,
        details: {
          ...healthResponse.details,
          badOracles: badOracles.map(({ url }) => url),
        },
      };
    }

    try {
      /* Get node's block height, highest block height from reference nodes */

      let externalHeights = await Promise.all(
        referenceUrls.map((ref) => this.getNEARBlockHeight(ref.url, basicAuth)),
      );
      const sortedExternalHeights = externalHeights.sort((a, b) => {
        return b - a;
      });

      const internalBh = await this.getNEARBlockHeight(url, basicAuth);

      const nodeHeight = internalBh;
      const peerHeight = sortedExternalHeights[0];

      /* Compare highest ref height with node's height */
      const delta = peerHeight - nodeHeight;
      const nodeIsAheadOfPeer = delta + allowance < 0;
      const height = { internalHeight: nodeHeight, externalHeight: peerHeight, delta };

      if (nodeIsAheadOfPeer) {
        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
          height,
          details: { ...healthResponse.details, nodeIsAheadOfPeer: Math.abs(delta) },
        };
      }

      // Not synced response
      if (delta > allowance || internalBh.error?.code) {
        const secondsToRecover = await this.updateNotSynced(delta, node.id.toString());
        if (secondsToRecover !== null) {
          healthResponse = {
            ...healthResponse,
            details: { ...healthResponse.details, secondsToRecover },
          };
        }

        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          health: internalBh.error?.code ? internalBh : null,
          height,
        };
      }

      // Healthy response
      return { ...healthResponse, height };
    } catch (error) {
      const isTimeout = String(error).includes(`Error: timeout of 1000ms exceeded`);
      if (isTimeout) {
        return {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NO_RESPONSE,
        };
      }
    }

    return {
      ...healthResponse,
      status: EErrorStatus.ERROR,
      conditions: EErrorConditions.NO_RESPONSE,
    };
  };

  /* ----- Pocket ----- */
  private getPocketNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    const { name, id, chain, url } = node;
    const { allowance } = chain;

    const { height: isRpcResponding } = await this.getPocketHeight(url);
    if (isRpcResponding === 0) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_RESPONSE,
      };
    }

    const refNodeUrls = await this.getPocketRefNodeUrls(id);
    if (!refNodeUrls?.length) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_PEERS,
      };
    }

    /* Get highest block height from reference nodes */
    const pocketRefHeights = await Promise.all(
      refNodeUrls.map((url) => this.getPocketHeight(url)),
    );
    const [highestRefHeight] = pocketRefHeights
      .map(({ height }) => height)
      .sort((a, b) => b - a);
    const peerHeight = Number(highestRefHeight);

    /* Get node's block height */
    const nodeHeight = Number((await this.getPocketHeight(url)).height);

    /* Compare highest ref height with node's height */
    const delta = peerHeight - nodeHeight;
    const notSynced = delta > allowance;
    const nodeIsAheadOfPeer = delta + allowance < 0;

    if (nodeIsAheadOfPeer) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
        height: { internalHeight: nodeHeight, externalHeight: peerHeight, delta },
      };
    }
    if (nodeHeight === 0) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_RESPONSE,
      };
    }
    if (notSynced) {
      const healthResponse: IHealthResponse = {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NOT_SYNCHRONIZED,
        height: { internalHeight: nodeHeight, externalHeight: peerHeight, delta },
      };
      const secondsToRecover = await this.updateNotSynced(delta, node.id.toString());
      if (secondsToRecover !== null) {
        healthResponse.details = { secondsToRecover };
      }
      return healthResponse;
    }

    return {
      name,
      status: EErrorStatus.OK,
      conditions: EErrorConditions.HEALTHY,
      height: { internalHeight: nodeHeight, externalHeight: peerHeight, delta },
    };
  };

  private async getPocketHeight(url: string, auth?: string): Promise<IPocketBlockHeight> {
    try {
      const { data } = await this.rpc.post(
        `${url}/v1/query/height`,
        {},
        this.getAxiosRequestConfig(auth),
      );
      return data;
    } catch (error) {
      return { height: 0 };
    }
  }

  private async getPocketRefNodeUrls(nodeId: Types.ObjectId): Promise<string[]> {
    const pocketChainIds = (
      await ChainsModel.find({ type: ESupportedBlockchainTypes.POKT })
    ).map(({ _id }) => _id);

    const healthyUrls = (
      await NodesModel.aggregate<INode>([
        {
          $match: {
            chain: { $in: pocketChainIds },
            _id: { $ne: nodeId },
            status: { $ne: EErrorStatus.ERROR },
          },
        },
        { $sample: { size: 20 } },
      ])
    ).map(({ url }) => url);

    return healthyUrls;
  }

  /* ----- Solana ----- */
  private getSolNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    const { name, url, basicAuth } = node;

    const execute = util.promisify(exec);
    const command = basicAuth
      ? `curl -u ${basicAuth} -X POST -H 'Content-Type: application/json' -s --data '{"jsonrpc": "2.0", "id": 1, "method": "getHealth"}' ${url}`
      : `curl -X POST -H 'Content-Type: application/json' -s --data '{"jsonrpc": "2.0", "id": 1, "method": "getHealth"}' ${url}`;

    try {
      const { stdout, stderr } = await execute(command);
      if (stderr) {
        return {
          name,
          conditions: EErrorConditions.NO_RESPONSE,
          status: EErrorStatus.ERROR,
          health: JSON.parse(stderr),
        };
      }

      const health = JSON.parse(stdout);
      const { result } = health;

      if (result == 'ok') {
        return {
          name,
          conditions: EErrorConditions.HEALTHY,
          status: EErrorStatus.OK,
          health,
        };
      } else {
        return {
          name,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          status: EErrorStatus.ERROR,
          health,
        };
      }
    } catch (error) {
      return {
        name,
        conditions: EErrorConditions.NO_RESPONSE,
        status: EErrorStatus.ERROR,
        health: error,
      };
    }
  };

  /* ----- Tendermint ----- */
  private getTendermintNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    const { name, url, basicAuth } = node;

    try {
      const { data } = await this.rpc.get(
        `${url}/status`,
        this.getAxiosRequestConfig(basicAuth),
      );
      const { catching_up } = data.result.sync_info;
      if (!catching_up) {
        return {
          name,
          conditions: EErrorConditions.HEALTHY,
          status: EErrorStatus.OK,
          health: data,
        };
      } else {
        return {
          name,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          status: EErrorStatus.ERROR,
          health: data,
        };
      }
    } catch (error) {
      return {
        name,
        conditions: EErrorConditions.NO_RESPONSE,
        status: EErrorStatus.ERROR,
        health: error,
      };
    }
  };

  /* Estimate Seconds to Recover for Not Synced - EVM and Pocket Nodes only. */

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
