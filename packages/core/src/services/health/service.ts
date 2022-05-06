import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { exec } from "child_process";
import { Types, UpdateQuery } from "mongoose";
import util from "util";

import { IChain, INode, ChainsModel, NodesModel, OraclesModel } from "../../models";
import {
  EErrorConditions,
  EErrorStatus,
  ENCResponse,
  ESupportedBlockchainTypes,
  IHealthResponse,
  IEVMHealthCheckOptions,
  IOraclesResponse,
  IPocketBlockHeight,
  IReferenceURL,
  IRPCResponse,
  IRPCSyncResponse,
} from "./types";
import { camelToTitle, hexToDec } from "../../utils";
import env from "../../environment";

export class Service {
  private rpc: AxiosInstance;

  constructor() {
    this.rpc = this.initClient();
  }

  private initClient(): AxiosInstance {
    const headers = { "Content-Type": "application/json" };
    const client = axios.create({ timeout: 10000, headers });
    axiosRetry(client, { retries: 5 });
    return client;
  }

  private getAxiosRequestConfig(auth: string): AxiosRequestConfig {
    if (auth) {
      const [username, password] = auth.split(":");
      return { auth: { username, password } };
    }
  }

  /* ----- Node Health Check ----- */
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
        { jsonrpc: "2.0", id: 1, method: "health.health" },
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
    const isNodeListening = await this.isNodeListening({ host: host.ip, port });
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
      const [internalBh, externalBh, ethSyncing] = await Promise.all([
        this.getBlockHeight(url, basicAuth, harmony),
        this.getReferenceBlockHeight(referenceUrls, allowance, harmony),
        this.getEthSyncing(url, basicAuth),
      ]);

      const { result } = await this.getExternalPeers(url, basicAuth);
      const numPeers = hexToDec(result);
      const nodeHeight = hexToDec(internalBh.result);
      const peerHeight = externalBh;

      /* Compare highest ref height with node's height */
      const difference = peerHeight - nodeHeight;
      const nodeIsAheadOfPeer = difference + allowance < 0;
      const delta = Math.abs(peerHeight - nodeHeight);

      if (nodeIsAheadOfPeer) {
        healthResponse = {
          ...healthResponse,
          details: { ...healthResponse.details, nodeIsAheadOfPeer: delta },
        };
      }

      if (internalBh.error?.code) {
        const secondsToRecover = await this.updateNodeNotSynced(
          nodeHeight,
          String(node.id),
        );
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
          health: internalBh,
        };
      }

      if (difference > allowance) {
        const secondsToRecover = await this.updateNodeNotSynced(
          nodeHeight,
          String(node.id),
        );
        if (secondsToRecover !== null) {
          healthResponse = {
            ...healthResponse,
            details: { ...healthResponse.details, secondsToRecover },
          };
        }
        healthResponse = {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
        };
      }

      if (nodeIsAheadOfPeer) {
        healthResponse = {
          ...healthResponse,
          status: EErrorStatus.ERROR,
          conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
        };
      }

      return {
        ...healthResponse,
        ethSyncing,
        peers: numPeers,
        height: { internalHeight: nodeHeight, externalHeight: peerHeight, delta },
      };
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

  private async isNodeListening({ host, port }) {
    try {
      const nc = await this.nc({ host, port });
      let status = nc.split(" ");
      return status[status.length - 1].includes(ENCResponse.SUCCESS);
    } catch (error) {
      return false;
    }
  }

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

  private async getOracles({ name }: IChain): Promise<IOraclesResponse> {
    const { urls } = await OraclesModel.findOne({ chain: name });

    const {
      healthyUrls: healthyOracles,
      badUrls: badOracles,
    } = await this.checkRefUrlHealth(urls.map((url) => ({ url })));

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
    const method = harmony ? "hmyv2_blockNumber" : "eth_blockNumber";

    try {
      const { data } = await this.rpc.post<IRPCResponse>(
        url,
        { jsonrpc: "2.0", id: 1, method, params: [] },
        this.getAxiosRequestConfig(auth),
      );
      return data;
    } catch (error) {
      const stringError = JSON.stringify(error);
      throw new Error(
        `getBlockHeight could not contact blockchain node ${stringError} ${url}`,
      );
    }
  }

  private async getReferenceBlockHeight(
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

  private async getEthSyncing(
    url: string,
    auth?: string,
    harmony?: boolean,
  ): Promise<string> {
    const method = harmony ? "hmyv2_syncing" : "eth_syncing";
    try {
      const { data } = await this.rpc.post<IRPCSyncResponse>(
        url,
        { jsonrpc: "2.0", id: 1, method, params: [] },
        this.getAxiosRequestConfig(auth),
      );
      return Object.entries(data.result)
        .map(([key, value]) => {
          const syncValue = key.toLowerCase().includes("hash") ? value : hexToDec(value);
          return `${camelToTitle(key)}: ${syncValue}`;
        })
        .join(" / ");
    } catch (error) {
      throw new Error(`getEthSyncing could not contact blockchain node ${error} ${url}`);
    }
  }

  private async getExternalPeers(url: string, auth?: string): Promise<IRPCResponse> {
    try {
      const { data } = await this.rpc.post<IRPCResponse>(
        url,
        { jsonrpc: "2.0", id: 1, method: "net_peerCount", params: [] },
        this.getAxiosRequestConfig(auth),
      );
      return data;
    } catch (error) {
      throw new Error(
        `getExternalPeers could not contact blockchain node ${error} ${url}`,
      );
    }
  }

  /* ----- Harmony ----- */
  private getHarmonyNodeHealth = async (node: INode): Promise<IHealthResponse> => {
    return await this.getEVMNodeHealth(node, { harmony: true });
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
    const difference = peerHeight - nodeHeight;
    const notSynced = difference > allowance;
    const nodeIsAheadOfPeer = difference + allowance < 0;
    const delta = Math.abs(peerHeight - nodeHeight);

    if (nodeIsAheadOfPeer) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
        delta,
        refNodeUrls: refNodeUrls.map((url) => `${url}\n`),
        highest: peerHeight,
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
      const secondsToRecover = await this.updateNodeNotSynced(
        nodeHeight,
        String(node.id),
      );
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

      if (result == "ok") {
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

  /* ----- Estimate Seconds to Recover for Not Synced ----- */

  /** Updates the Node's time to recover fields if it's not synced.
   * When the node becomes healthy again, heightArray and secondsToRecover
   * are reset inside the Event service */
  private async updateNodeNotSynced(height: number, nodeId: string): Promise<number> {
    const { heightArray } = await NodesModel.findOne({ _id: nodeId })
      .select("heightArray")
      .exec();
    const newHeightArray = this.getNodeHeightArray(height, heightArray);

    await NodesModel.updateOne({ _id: nodeId }, { heightArray: newHeightArray });

    return this.getSecondsToRecover(newHeightArray);
  }

  /** Saves the last 5 recorded block heights to the node model if not synced */
  private getNodeHeightArray(height: number, heightArray: number[]): number[] {
    return heightArray?.length ? [height, ...heightArray].slice(0, 120) : [height];
  }

  /** Gets an estimated time to recover based on the last 5 recorded block heights */
  private getSecondsToRecover(heightArray: number[]): number {
    if (heightArray?.length < 2) return null;

    const [newestHeight] = heightArray;
    const oldestHeight = heightArray[heightArray.length - 1];

    /* If Delta is increasing return -1 */
    if (newestHeight > oldestHeight) {
      return -1;
    }
    /* If Delta is stuck return 0 */
    if (newestHeight === oldestHeight) {
      return 0;
    }

    /* Calculate estimated time to recover in seconds */
    const heightDiffArr = heightArray.map((h, i, a) => a[i + 1] - h).slice(0, -1);
    const avgHeightDiff = heightDiffArr.reduce((a, c) => a + c) / heightDiffArr.length;
    const numIntervals = (oldestHeight - newestHeight) / avgHeightDiff;
    const secondsToRecover = Math.floor(numIntervals * (env("MONITOR_INTERVAL") / 1000));

    return secondsToRecover;
  }
}
