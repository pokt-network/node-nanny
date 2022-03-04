import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import util from "util";
import axiosRetry from "axios-retry";
import { exec } from "child_process";
import {
  ErrorConditions,
  ErrorStatus,
  NCResponse,
  HealthResponse,
  SupportedBlockChainTypes,
  IReferenceURL,
  IRPCResponse,
  IRPCSyncResponse,
} from "./types";

import { hexToDec } from "../../utils";
import { INode, NodesModel, OraclesModel } from "../../models";

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

  /* ----- Health Check Methods ----- */
  public async getNodeHealth(node: INode): Promise<HealthResponse> {
    const { chain } = node;

    if (!Object.keys(SupportedBlockChainTypes).includes(chain.type)) {
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
  }): Promise<HealthResponse> => {
    const name = `${host.name}/${chain.name}`;
    try {
      const { data, status } = await this.rpc.get(
        `${url}/health`,
        this.getAxiosRequestConfig(basicAuth),
      );
      if (status == 200) {
        return {
          name,
          conditions: ErrorConditions.HEALTHY,
          status: ErrorStatus.OK,
        };
      } else {
        return {
          name,
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
          health: data ? data.result : [],
        };
      }
    } catch (error) {
      return {
        name,
        conditions: ErrorConditions.NO_RESPONSE,
        status: ErrorStatus.ERROR,
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
  }): Promise<HealthResponse> => {
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
          conditions: ErrorConditions.HEALTHY,
          status: ErrorStatus.OK,
          health: result,
        };
      } else {
        return {
          name,
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
          health: result,
        };
      }
    } catch (error) {
      return {
        name,
        conditions: ErrorConditions.NO_RESPONSE,
        status: ErrorStatus.ERROR,
        health: error,
      };
    }
  };

  /* ----- Ethereum Virtual Machine ----- */
  private getEVMNodeHealth = async (
    { chain, url, variance, host, id, port, basicAuth, server }: INode,
    hmy?: boolean,
  ): Promise<HealthResponse> => {
    const name = `${host.name}/${chain.name}/${server}`;

    //Check if node is online and RPC up
    const isNodeListening = await this.isNodeListening({ host: host.ip, port });
    if (!isNodeListening) {
      return {
        name,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.OFFLINE,
      };
    }
    const isRpcResponding = await this.isRpcResponding({ url }, basicAuth, hmy);
    if (!isRpcResponding) {
      return {
        name,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_RESPONSE,
      };
    }

    let { urls: externalNodes } = await OraclesModel.findOne({
      chain: chain.name,
    }).exec();

    let referenceUrls = await this.checkExternalUrls(externalNodes);
    let peers: INode[] = await NodesModel.find({ chain, _id: { $ne: id } }).exec();
    peers = peers.filter(
      async ({ url, basicAuth }) => await this.isRpcResponding({ url }, basicAuth),
    );
    if (peers.length >= 1) {
      for (const { url, basicAuth } of peers) {
        referenceUrls.push({ url, auth: basicAuth });
      }
    }

    try {
      const [internalBh, externalBh, ethSyncing] = await Promise.all([
        this.getBlockHeight(url, basicAuth, hmy),
        this.getReferenceBlockHeight(referenceUrls, variance, hmy),
        this.getEthSyncing(url, basicAuth),
      ]);

      const { result } = await this.getPeers(url, basicAuth);
      const numPeers = hexToDec(result);
      const internalHeight = hexToDec(internalBh.result);
      const externalHeight = externalBh;

      const ethSyncingResult = ethSyncing.result;
      const delta = externalHeight - internalHeight;

      let status = ErrorStatus.OK;
      let conditions = ErrorConditions.HEALTHY;

      if (internalBh.error?.code) {
        return {
          name,
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
          health: internalBh,
        };
      }

      if (delta > variance) {
        status = ErrorStatus.ERROR;
        conditions = ErrorConditions.NOT_SYNCHRONIZED;
      }

      if (Math.sign(delta + variance) === -1) {
        status = ErrorStatus.ERROR;
        conditions = ErrorConditions.PEER_NOT_SYNCHRONIZED;
      }

      return {
        name,
        status,
        conditions,
        ethSyncing: ethSyncingResult,
        peers: numPeers,
        height: {
          internalHeight,
          externalHeight,
          delta,
        },
      };
    } catch (error) {
      if (
        String(error).includes(
          `could not contact blockchain node Error: timeout of 1000ms exceeded`,
        )
      ) {
        return {
          name,
          status: ErrorStatus.ERROR,
          conditions: ErrorConditions.NO_RESPONSE,
        };
      }
    }

    return {
      name,
      status: ErrorStatus.ERROR,
      conditions: ErrorConditions.NO_RESPONSE,
    };
  };

  private async isNodeListening({ host, port }) {
    try {
      const nc = await this.nc({ host, port });
      let status = nc.split(" ");
      return status[status.length - 1].includes(NCResponse.SUCCESS);
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

  private async isRpcResponding({ url }, auth?: string, hmy?: boolean): Promise<boolean> {
    try {
      await this.getBlockHeight(url, auth, hmy);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkExternalUrls(urls: string[]): Promise<IReferenceURL[]> {
    return Promise.all(
      urls
        .filter(async (url) => {
          try {
            await this.getBlockHeight(url);
            return true;
          } catch (error) {
            return false;
          }
        })
        .map((url) => ({ url } as IReferenceURL)),
    );
  }

  private async getBlockHeight(
    url: string,
    auth?: string,
    hmy?: boolean,
  ): Promise<IRPCResponse> {
    const method = hmy ? "hmyv2_blockNumber" : "eth_blockNumber";
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
    hmy: boolean,
  ): Promise<number> {
    const resolved: IRPCResponse[] = [];
    for (const { url, auth } of endpoints) {
      try {
        resolved.push(await this.getBlockHeight(url, auth, hmy));
      } catch (error) {
        ////console.error(`could not get reading ${error}`);
      }
    }

    const readings = resolved
      .filter((reading) => reading.result)
      .map(({ result }) => hexToDec(result));
    //const height = this.getBestBlockHeight({ readings, variance });

    return readings.sort()[0];
  }

  private async getEthSyncing(
    url: string,
    auth?: string,
    hmy?: boolean,
  ): Promise<IRPCSyncResponse> {
    const method = hmy ? "hmyv2_syncing" : "eth_syncing";
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

  private async getPeers(url, auth?: string): Promise<IRPCResponse> {
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
  private getHarmonyNodeHealth = async (node) => {
    return await this.getEVMNodeHealth(node, true);
  };

  /* ----- Pocket ----- */
  private getPocketNodeHealth = async ({ hostname, port, variance, id }: INode) => {
    const { height: isRpcResponding } = await this.getPocketHeight(
      `https://${hostname}:${port}`,
    );
    if (isRpcResponding === 0) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_RESPONSE,
      };
    }

    // get list of reference nodes
    const referenceNodes: INode[] = await NodesModel.find(
      { "chain.type": "POKT", _id: { $ne: id } },
      null,
      { limit: 20 },
    ).exec();

    if (!referenceNodes || referenceNodes.length === 0) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_PEERS,
      };
    }

    //get highest block height from reference nodes
    const poktnodes = referenceNodes.map(
      ({ hostname, port }) => `https://${hostname}:${port}`,
    );

    const pocketheight = await Promise.all(
      poktnodes.map(async (node) => await this.getPocketHeight(node)),
    );

    const [highest] = pocketheight
      .map(({ height }) => height)
      .sort()
      .slice(-1);
    const { height } = await this.getPocketHeight(`https://${hostname}:${port}`);
    const notSynched = Number(highest) - Number(height) > variance;
    if (Math.sign(Number(highest) - Number(height) + variance) === -1) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.PEER_NOT_SYNCHRONIZED,
        delta: Number(highest) - Number(height),
        referenceNodes: referenceNodes.map(({ hostname }) => `${hostname} \n`),
        highest,
        height,
      };
    }

    if (height === 0) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_RESPONSE,
      };
    }

    if (notSynched) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NOT_SYNCHRONIZED,
        height: {
          internalHeight: height,
          externalHeight: highest,
          delta: Number(highest) - Number(height),
        },
      };
    }

    return {
      name: hostname,
      status: ErrorStatus.OK,
      conditions: ErrorConditions.HEALTHY,
      height: {
        internalHeight: height,
        externalHeight: highest,
        delta: Number(highest) - Number(height),
      },
    };
  };

  // DEV NOTE --> Needs return & rpc.post type
  private async getPocketHeight(url: string, auth?: string): Promise<any> {
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
  }): Promise<HealthResponse> => {
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
          conditions: ErrorConditions.NO_RESPONSE,
          status: ErrorStatus.ERROR,
          health: JSON.parse(stderr),
        };
      }

      const health = JSON.parse(stdout);
      const { result } = health;

      if (result == "ok") {
        return {
          name,
          conditions: ErrorConditions.HEALTHY,
          status: ErrorStatus.OK,
          health,
        };
      } else {
        return {
          name,
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
          health,
        };
      }
    } catch (error) {
      return {
        name,
        conditions: ErrorConditions.NO_RESPONSE,
        status: ErrorStatus.ERROR,
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
  }): Promise<HealthResponse> => {
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
          conditions: ErrorConditions.HEALTHY,
          status: ErrorStatus.OK,
          health: data,
        };
      } else {
        return {
          name,
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
          health: data,
        };
      }
    } catch (error) {
      return {
        name,
        conditions: ErrorConditions.NO_RESPONSE,
        status: ErrorStatus.ERROR,
        health: error,
      };
    }
  };

  // private getBestBlockHeight({ readings, variance }) {
  //   if (readings.length === 1) {
  //     return readings[0];
  //   }
  //   const sorted = readings.sort();
  //   const [last] = sorted.slice(-1);
  //   const [secondLast] = sorted.slice(-2);
  //   console.log(0x1506068)
  //   if (last - secondLast < variance) {
  //     return sorted.pop();
  //   } else {
  //     return sorted.pop();
  //   }
  // }
}
