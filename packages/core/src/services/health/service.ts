import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import util from "util";
import axiosRetry from "axios-retry";
import { exec } from "child_process";
import { Types } from "mongoose";

import { IChain, INode, NodesModel, OraclesModel } from "../../models";
import {
  EErrorConditions,
  EErrorStatus,
  ENCResponse,
  ESupportedBlockChainTypes,
  IHealthResponse,
  IHealthResponseDetails,
  IEVMHealthCheckOptions,
  IOraclesAndPeers,
  IPocketBlockHeight,
  IReferenceURL,
  IRPCResponse,
  IRPCSyncResponse,
} from "./types";
import { hexToDec } from "../../utils";

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

  private getAxiosRequestConfig(auth: string): AxiosRequestConfig | undefined {
    if (auth) {
      const [username, password] = auth.split(":");
      return { auth: { username, password } };
    }
  }

  /* ----- Health Check Methods ----- */
  public async getNodeHealth(node: INode): Promise<IHealthResponse> {
    const { chain } = node;

    if (!Object.keys(ESupportedBlockChainTypes).includes(chain.type)) {
      throw new Error(`${chain.type} is not a supported chain type`);
    }

    return await {
      ALG: this.getAlgorandNodeHealth,
      AVA: this.getAvaNodeHealth,
      EVM: this.getEVMNodeHealth,
      HMY: this.getHarmonyNodeHealth,
      POKT: this.getPocketNodeHealth,
      SOL: this.getSolNodeHealth,
      TMT: this.getTendermintNodeHealth,
    }[chain.type](node);
  }

  /* ----- Algorand ----- */
  private getAlgorandNodeHealth = async ({
    url,
    host,
    chain,
    basicAuth,
  }: INode): Promise<IHealthResponse> => {
    const name = `${host.name}/${chain.name}`;

    try {
      const { data, status } = await this.rpc.get(
        `${url}/health`,
        this.getAxiosRequestConfig(basicAuth),
      );
      if (status == 200) {
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
  private getAvaNodeHealth = async ({
    url,
    host,
    chain,
    basicAuth,
  }: INode): Promise<IHealthResponse> => {
    const name = `${host.name}/${chain.name}`;
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
    { chain, url, host, id, port, basicAuth, server }: INode,
    { harmony }: IEVMHealthCheckOptions = { harmony: false },
  ): Promise<IHealthResponse> => {
    const { variance } = chain;
    const healthResponse: IHealthResponse = {
      name: `${host.name}/${chain.name}/${server}`,
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
    const { healthyOracles, healthyPeers, badOracles } = await this.getOraclesAndPeers(
      chain,
      id,
    );
    if (!healthyOracles.length && healthyPeers.length < 2) {
      return {
        ...healthResponse,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_PEERS,
      };
    } else if (!healthyOracles.length && healthyPeers.length >= 2) {
      healthResponse.sendWarning = true;
      healthResponse.conditions = EErrorConditions.NO_ORACLE;
    } else if (badOracles.length) {
      healthResponse.sendWarning = true;
      healthResponse.conditions = EErrorConditions.BAD_ORACLE;
      healthResponse.details = { badOracles: badOracles.map(({ url }) => url) };
    }

    const referenceUrls = [...healthyOracles, ...healthyPeers];
    try {
      const [internalBh, externalBh, ethSyncing] = await Promise.all([
        this.getBlockHeight(url, basicAuth, harmony),
        this.getReferenceBlockHeight(referenceUrls, variance, harmony),
        this.getEthSyncing(url, basicAuth),
      ]);

      const { result } = await this.getPeers(url, basicAuth);
      const numPeers = hexToDec(result);
      const internalHeight = hexToDec(internalBh.result);
      const externalHeight = externalBh;

      const ethSyncingResult = ethSyncing.result;
      const delta = Math.abs(externalHeight - internalHeight);

      if (internalBh.error?.code) {
        return {
          ...healthResponse,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          status: EErrorStatus.ERROR,
          health: internalBh,
        };
      }

      if (delta > variance) {
        healthResponse.status = EErrorStatus.ERROR;
        healthResponse.conditions = EErrorConditions.NOT_SYNCHRONIZED;
      }

      if (Math.sign(delta + variance) === -1) {
        healthResponse.status = EErrorStatus.ERROR;
        healthResponse.conditions = EErrorConditions.PEER_NOT_SYNCHRONIZED;
      }

      return {
        ...healthResponse,
        ethSyncing: ethSyncingResult,
        peers: numPeers,
        height: { internalHeight, externalHeight, delta },
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

  private async getOraclesAndPeers(
    { id: chainId, name: chain }: IChain,
    nodeId: Types.ObjectId,
  ): Promise<IOraclesAndPeers> {
    const { urls } = await OraclesModel.findOne({ chain });
    const {
      healthyUrls: healthyOracles,
      badUrls: badOracles,
    } = await this.checkRefUrlHealth(urls.map((url) => ({ url })));

    const peers = await NodesModel.find({ chain: chainId, _id: { $ne: nodeId } });
    const { healthyUrls: healthyPeers } = await this.checkRefUrlHealth(
      peers.map(({ url, basicAuth: auth }) => ({ url, auth })),
    );

    return { healthyOracles, healthyPeers, badOracles };
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
    _variance: number,
    harmony: boolean,
  ): Promise<number> {
    const resolved = await Promise.all(
      endpoints.map(({ url, auth }) => this.getBlockHeight(url, auth, harmony)),
    );

    const readings = resolved
      .filter((reading) => reading.result)
      .map(({ result }) => hexToDec(result));
    return readings.sort()[0];
  }

  private async getEthSyncing(
    url: string,
    auth?: string,
    harmony?: boolean,
  ): Promise<IRPCSyncResponse> {
    const method = harmony ? "hmyv2_syncing" : "eth_syncing";
    try {
      const { data } = await this.rpc.post<IRPCSyncResponse>(
        url,
        { jsonrpc: "2.0", id: 1, method, params: [] },
        this.getAxiosRequestConfig(auth),
      );
      return data;
    } catch (error) {
      throw new Error(`getEthSyncing could not contact blockchain node ${error} ${url}`);
    }
  }

  private async getPeers(url: string, auth?: string): Promise<IRPCResponse> {
    try {
      const { data } = await this.rpc.post<IRPCResponse>(
        url,
        { jsonrpc: "2.0", id: 1, method: "net_peerCount", params: [] },
        this.getAxiosRequestConfig(auth),
      );
      return data;
    } catch (error) {
      throw new Error(`getPeers could not contact blockchain node ${error} ${url}`);
    }
  }

  /* ----- Harmony ----- */
  private getHarmonyNodeHealth = async ({
    host,
    chain,
    url,
  }: INode): Promise<IHealthResponse> => {
    const name = `${host.name}/${chain.name}`;

    try {
      const { data } = await this.rpc.get(`${url}/node-sync`);
      if (data === true) {
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
        };
      }
    } catch (error) {
      if (!error.response) {
        return {
          name,
          conditions: EErrorConditions.NO_RESPONSE,
          status: EErrorStatus.ERROR,
          health: error,
        };
      }
      if (error.response.data === false) {
        return {
          name,
          conditions: EErrorConditions.NOT_SYNCHRONIZED,
          status: EErrorStatus.ERROR,
        };
      }
    }
  };

  /* ----- Pocket ----- */
  private getPocketNodeHealth = async ({
    id,
    host: { fqdn, ip, name },
    chain: { id: chainId, variance },
    port,
  }: INode): Promise<IHealthResponse> => {
    const url = fqdn ? `https://${fqdn}:${port}` : `http://${ip}:${port}`;

    const { height: isRpcResponding } = await this.getPocketHeight(url);
    if (isRpcResponding === 0) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_RESPONSE,
      };
    }

    const query = { chain: chainId, _id: { $ne: id } };
    const referenceNodes = await NodesModel.find(query, null, { limit: 20 })
      .populate("host")
      .exec();
    if (!referenceNodes?.length) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_PEERS,
      };
    }

    // Get highest block height from reference nodes
    const pocketNodes = referenceNodes.map(({ host, port }) => {
      const { fqdn, ip } = host;
      return fqdn ? `https://${fqdn}:${port}` : `http://${ip}:${port}`;
    });
    const pocketHeight = await Promise.all(
      pocketNodes.map((node) => this.getPocketHeight(node)),
    );
    const [highest] = pocketHeight
      .map(({ height }) => height)
      .sort()
      .slice(-1);
    const { height } = await this.getPocketHeight(url);
    const notSynched = Number(highest) - Number(height) > variance;

    if (Math.sign(Number(highest) - Number(height) + variance) === -1) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.PEER_NOT_SYNCHRONIZED,
        delta: Number(highest) - Number(height),
        referenceNodes: referenceNodes.map(({ hostname }) => `${hostname} \n`),
        highest,
        height,
      };
    }
    if (height === 0) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NO_RESPONSE,
      };
    }
    if (notSynched) {
      return {
        name,
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NOT_SYNCHRONIZED,
        height: {
          internalHeight: height,
          externalHeight: highest,
          delta: Number(highest) - Number(height),
        },
      };
    }
    return {
      name,
      status: EErrorStatus.OK,
      conditions: EErrorConditions.HEALTHY,
      height: {
        internalHeight: height,
        externalHeight: highest,
        delta: Number(highest) - Number(height),
      },
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

  /* ----- Solana ----- */
  private getSolNodeHealth = async ({
    url,
    host,
    chain,
    hostname,
    basicAuth,
  }: INode): Promise<IHealthResponse> => {
    const name = `${host.name}/${chain.name}`;
    const execute = util.promisify(exec);
    if (hostname) {
      url = `https://${hostname}`;
    }

    let command: string;
    if (basicAuth) {
      `curl -u ${basicAuth} -X POST -H 'Content-Type: application/json' -s --data '{"jsonrpc": "2.0", "id": 1, "method": "getHealth"}' ${url}`;
    } else {
      command = `curl -X POST -H 'Content-Type: application/json' -s --data '{"jsonrpc": "2.0", "id": 1, "method": "getHealth"}' ${url}`;
    }
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
  private getTendermintNodeHealth = async ({
    url,
    host,
    chain,
    basicAuth,
  }: INode): Promise<IHealthResponse> => {
    const name = `${host.name}/${chain.name}`;
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
}
