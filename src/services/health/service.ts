import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";

import {
  ErrorConditions,
  ErrorStatus,
  NCResponse,
  HealthResponse,
  SupportedBlockChainTypes,
} from "./types";

import { DiscoverTypes } from "../../types";
import { hexToDec } from "../../utils";
import { SupportedBlockChains } from "../event/types";


import { INode, NodesModel } from "../../models";

export class Service {
  private rpc: AxiosInstance;
  constructor() {
    this.rpc = this.initClient();
  }

  private initClient() {
    return axios.create({
      timeout: 1000,
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
      return data;
    } catch (error) {
      throw new Error(`could not contact blockchain node ${error} ${url}`);
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
      throw new Error(`could not contact blockchain node ${error} ${url}`);
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
      throw new Error(`could not contact blockchain node ${error} ${url}`);
    }
  }

  private async getAvaHealth({ name, url }): Promise<HealthResponse> {
    try {
      const { data } = await this.rpc.post(`${url}/ext/health`, {
        jsonrpc: "2.0",
        id: 1,
        method: "health.getLiveness",
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
      throw new Error(`could not contact blockchain node ${error} ${url}`);
    }
  }


  async getHeimdallHealth({ name, url }) {
    try {
      const { data } = await this.rpc.get(`${url}/status`);
      const { catching_up } = data.result.sync_info
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
      throw new Error(`could not contact blockchain node ${error} ${url}`);
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

  private async isRpcResponding({ url, chain }): Promise<boolean> {
    try {
      if (chain === DiscoverTypes.Supported.AVA || chain === DiscoverTypes.Supported.AVATST) {
        await this.rpc.post(`${url}/ext/health`, {
          jsonrpc: "2.0",
          id: 1,
          method: "health.getLiveness",
        });
      } else {
        await this.getBlockHeight(url);
      }
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
      console.error(`block height not within variance ${readings}`);
      return sorted.pop();
    }
  }

  private async getReferenceBlockHeight({ endpoints, variance }): Promise<number> {
    try {
      const results = endpoints.map((endpoint) => this.getBlockHeight(endpoint));
      const resolved = await Promise.all(results);
      const readings = resolved.map(({ result }) => hexToDec(result));
      const height = this.getBestBlockHeight({ readings, variance });
      return height;
    } catch (error) {
      throw new Error(`could not get reference block height`);
    }
  }

  private async nc({ host, port }): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`nc -vz -q 2 ${host} ${port}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`nc ${error}`);
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

  private async getEthNodeHealth(node: INode): Promise<{}> {
    const { chain, url, externalNodes, variance, threshold, host } = node
    const [peer] = node.peer
    const name = `${host.name}/${chain.name}`
    const isPeerOnline = await this.isRpcResponding({ url: peer.url, chain: chain.name })

    //if peer online combine with external nodes
    const referenceUrls = externalNodes;

    if (isPeerOnline) {
      const { url } = peer;
      referenceUrls.push(url);
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
        peers = await this.getPeers(url)
        numPeers = hexToDec(peers.result);
      }

      const internalHeight = hexToDec(internalBh.result);
      const externalHeight = externalBh;

      const ethSyncingResult = ethSyncing.result;
      const delta = externalHeight - internalHeight;

      let status = ErrorStatus.OK;
      let conditions = ErrorConditions.HEALTHY;

      if (delta > threshold) {
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
      throw new Error(`could not get eth health ${error}`);
    }
  }

  async getPocketNodeHealth({ hostname, port, host, variance }: INode) {
    // get list of reference nodes
    //todo move to discover, get random sample of reference nodes instead of all
    const refernceNodes: INode[] = await NodesModel.find({
      "chain.type": "POKT"
    }).exec()
    //get highest block height from reference nodes
    const poktnodes = refernceNodes.map(({ hostname, port }) => `https://${hostname}:${port}`)
    const pocketheight = await Promise.all(await poktnodes.map(async (node) => this.getPocketHeight(node)))
    const [highest] = pocketheight.map(({ height }) => height).sort().slice(-1)
    const { height } = await this.getPocketHeight(`https://${hostname}:${port}`)

    const isSyncronized = (Number(highest) - Number(height) < variance)

    if (!isSyncronized) {
      return {
        name: hostname,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NOT_SYNCHRONIZED,
        height: {
          internalHeight: height,
          externalHeight: highest,
          delta: (Number(highest) - Number(height)),
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
        delta: (Number(highest) - Number(height)),
      },
    };

  }

  async getNodeHealth(nodes: INode[]) {
    const results = []
    for (const node of nodes) {
      const { chain, host, hostname, port, url } = node;
      //Check if node is online and RPC up
      const isNodeListening = await this.isNodeListening({ host: host.internalIpaddress, port });
      let isRpcResponding

      if (node.chain.type == SupportedBlockChainTypes.POKT) {
        const { height } = await this.getPocketHeight(`https://${hostname}:${port}`)
        isRpcResponding = (height !== 0)
      } else {
        isRpcResponding = await this.isRpcResponding({ url, chain: chain.name })
      }

      if (!isNodeListening) {
        results.push({
          name: hostname,
          status: ErrorStatus.ERROR,
          conditions: ErrorConditions.OFFLINE,
        })
      }

      if (isNodeListening && !isRpcResponding) {
        results.push({
          name: hostname,
          status: ErrorStatus.ERROR,
          conditions: ErrorConditions.NO_RESPONSE,
        })
      }

      //Check Health
      if (isNodeListening && isRpcResponding) {
        if (chain.type == SupportedBlockChainTypes.POKT) {
          results.push(await this.getPocketNodeHealth(node))
        }
        if (chain.type == SupportedBlockChainTypes.ETH) {
          results.push(await this.getEthNodeHealth(node))
        }
        if (chain.type == SupportedBlockChainTypes.AVA) {
          results.push(await this.getAvaHealth({ name: `${host.name}/${chain.name}`, url: url }))
        }
        if (chain.type == SupportedBlockChainTypes.HEI) {
          results.push(await this.getHeimdallHealth({ name: `${host.name}/${chain.name}`, url: url }))
        }
      }
    }
    return results
  }
}
