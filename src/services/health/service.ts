import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import {
  ErrorConditions,
  ErrorStatus,
  NCResponse,
  HealthResponse,
  SupportedBlockChainTypes,
  SupportedBlockChains,
} from "./types";

import { hexToDec } from "../../utils";
import { INode, NodesModel, OraclesModel } from "../../models";

export class Service {
  private rpc: AxiosInstance;
  constructor() {
    this.rpc = this.initClient();
  }

  private initClient() {
    return axios.create({
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
  }
  private async getBlockHeight(url) {
    try {
      const { data } = await this.rpc.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
        params: [],
      });
      if (data.error) {
        throw new Error(`getBlockHeight could not contact blockchain node ${data.error} ${url}`);
      }
      return data;
    } catch (error) {
      throw new Error(`getBlockHeight could not contact blockchain node ${error} ${url}`);
    }
  }

  private async getEthSyncing(url) {
    try {
      const { data } = await this.rpc.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_syncing",
        params: [],
      });
      return data;
    } catch (error) {
      throw new Error(`getEthSyncing could not contact blockchain node ${error} ${url}`);
    }
  }

  private async getPeers(url) {
    try {
      const { data } = await this.rpc.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "net_peerCount",
        params: [],
      });
      return data;
    } catch (error) {
      throw new Error(`getPeers could not contact blockchain node ${error} ${url}`);
    }
  }

  private async getAvaHealth({ name, url }): Promise<HealthResponse> {
    const threshold = [];
    try {
      const { data } = await this.rpc.post(`${url}/ext/health`, {
        jsonrpc: "2.0",
        id: 1,
        method: "health.health",
      });

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
  }

  async getHeimdallHealth({ name, url }) {
    try {
      const { data } = await this.rpc.get(`${url}/status`);
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
  }

  private async getPocketHeight(url) {
    try {
      const { data } = await this.rpc.post(`${url}/v1/query/height`, {});
      return data;
    } catch (error) {
      console.error(`could not contact pocket node ${error} ${url}`);
      return { height: 0 };
    }
  }

  private async isRpcResponding({ url }): Promise<boolean> {
    try {
      await this.getBlockHeight(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  private getBestBlockHeight({ readings, variance }) {
    if (readings.length === 1) {
      return readings[0];
    }
    const sorted = readings.sort();
    const [last] = sorted.slice(-1);
    const [secondLast] = sorted.slice(-2);
    if (last - secondLast < variance) {
      return sorted.pop();
    } else {
      return sorted.pop();
    }
  }

  private async getReferenceBlockHeight({ endpoints, variance }): Promise<number> {
    const resolved = [];
    for (const endpoint of endpoints) {
      try {
        resolved.push(await this.getBlockHeight(endpoint));
      } catch (error) {
        console.error(`could not get reading ${error}`);
      }
    }
    const readings = resolved.map(({ result }) => hexToDec(result));
    const height = this.getBestBlockHeight({ readings, variance });
    return height;
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

  private async isNodeListening({ host, port }) {
    try {
      const nc = await this.nc({ host, port });
      let status = nc.split(" ");
      return status[status.length - 1].includes(NCResponse.SUCCESS);
    } catch (error) {
      return false;
    }
  }

  private async checkExternalUrls(urls) {
    return Promise.all(
      await urls.filter(async (url) => {
        try {
          await this.getBlockHeight(url);
          return true;
        } catch (error) {
          return false;
        }
      }),
    );
  }

  private async getEVMNodeHealth(node: INode): Promise<{}> {
    const { chain, url, variance, host, id, port } = node;
    const name = `${host.name}/${chain.name}`;
    //Check if node is online and RPC up
    const isNodeListening = await this.isNodeListening({ host: host.internalIpaddress, port });

    if (!isNodeListening) {
      return {
        name,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.OFFLINE,
      };
    }
    const isRpcResponding = await this.isRpcResponding({ url });

    if (!isRpcResponding) {
      return {
        name,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_RESPONSE,
      };
    }

    let peers: INode[] = await NodesModel.find({
      "chain.name": chain.name,
      _id: { $ne: id },
    }).exec();
    let { urls: externalNodes } = await OraclesModel.findOne({ chain: chain.name }).exec();

    const referenceUrls = await this.checkExternalUrls(externalNodes);

    peers = peers.filter(async (peer) => await this.isRpcResponding({ url: peer.url }));

    if (peers.length >= 1) {
      for (const { url } of peers) {
        referenceUrls.push(url);
      }
    }

    try {
      const [internalBh, externalBh, ethSyncing] = await Promise.all([
        this.getBlockHeight(url),
        this.getReferenceBlockHeight({ endpoints: referenceUrls, variance }),
        this.getEthSyncing(url),
      ]);

      let peers;
      let numPeers;

      if (!(chain.name == SupportedBlockChains.POL || chain.name == SupportedBlockChains.POLTST)) {
        peers = await this.getPeers(url);
        numPeers = hexToDec(peers.result);
      }

      const internalHeight = hexToDec(internalBh.result);
      const externalHeight = externalBh;

      const ethSyncingResult = ethSyncing.result;
      const delta = externalHeight - internalHeight;

      let status = ErrorStatus.OK;
      let conditions = ErrorConditions.HEALTHY;

      if (delta > variance) {
        status = ErrorStatus.ERROR;
        conditions = ErrorConditions.NOT_SYNCHRONIZED;
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
  }

  async getSolHealth({ url, name }) {
    try {
      const { data } = await this.rpc.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      });

      const { result } = data;

      if (result == "ok") {
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
  }

  async getAlgorandHealth({ url, name }) {
    try {
      const { data, status } = await this.rpc.get(`${url}/health`);
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
  }

  async getHarmonyHealth({ url, name }) {
    try {
      const { data } = await this.rpc.get(`${url}/node-sync`);
      if (data === true) {
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
        };
      }
    } catch (error) {
      if (error.response.data && error.response.data === false) {
        return {
          name,
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
        };
      }
      return {
        name,
        conditions: ErrorConditions.NO_RESPONSE,
        status: ErrorStatus.ERROR,
        health: error,
      };
    }
  }

  async getPocketNodeHealth({ hostname, port, variance, id }: INode) {
    const { height: isRpcResponding } = await this.getPocketHeight(`https://${hostname}:${port}`);

    if (isRpcResponding === 0) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_RESPONSE,
      };
    }

    // get list of reference nodes
    const referenceNodes: INode[] = await NodesModel.find(
      {
        "chain.type": "POKT",
        _id: { $ne: id },
      },
      null,
      { limit: 10 },
    ).exec();

    //get highest block height from reference nodes
    const poktnodes = referenceNodes.map(({ hostname, port }) => `https://${hostname}:${port}`);
    const pocketheight = await Promise.all(
      await poktnodes.map(async (node) => this.getPocketHeight(node)),
    );
    const [highest] = pocketheight
      .map(({ height }) => height)
      .sort()
      .slice(-1);
    const { height } = await this.getPocketHeight(`https://${hostname}:${port}`);
    const notSynched = Number(highest) - Number(height) > variance;


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
  }

  async getNodeHealth(node: INode) {
    const { chain, host, url } = node;
    if (chain.type == SupportedBlockChainTypes.POKT) {
      return await this.getPocketNodeHealth(node);
    }
    if (chain.type == SupportedBlockChainTypes.ETH) {
      return await this.getEVMNodeHealth(node);
    }
    if (chain.type == SupportedBlockChainTypes.AVA) {
      return await this.getAvaHealth({ name: `${host.name}/${chain.name}`, url: url });
    }
    if (chain.type == SupportedBlockChainTypes.HEI) {
      return await this.getHeimdallHealth({ name: `${host.name}/${chain.name}`, url: url });
    }
    if (chain.type == SupportedBlockChainTypes.SOL) {
      return await this.getSolHealth({ name: `${host.name}/${chain.name}`, url: url });
    }
    if (chain.type == SupportedBlockChainTypes.ALG) {
      return await this.getAlgorandHealth({ name: `${host.name}/${chain.name}`, url: url });
    }
    if (chain.type === SupportedBlockChainTypes.HRM) {
      return await this.getHarmonyHealth({ name: `${host.name}/${chain.name}`, url: url });
    }
    return -1;
  }
}
