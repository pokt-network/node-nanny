import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";

import {
  ErrorConditions,
  ErrorStatus,
  EthVariants,
  NCResponse,
  BlockHeightVariance,
  HealthResponse,
} from "./types";

import { DiscoverTypes } from "../../types";
import { hexToDec } from "../../utils";
import { SupportedBlockChains } from "../event/types";


import { INode, NodesModel } from "../../models";

export class Service {
  private rpc: AxiosInstance;
  private ethVariants;
  constructor() {
    this.rpc = this.initClient();
    this.ethVariants = Object.keys(EthVariants);
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

  private async getEthNodeHealth({
    url,
    name,
    chain,
    peer,
    external,
    isPeerOnline,
    variance,
    threshold
  }): Promise<{}> {
    const referenceUrls = external;

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

      if (!(chain == SupportedBlockChains.POL || chain == SupportedBlockChains.POLTST)) {
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

  private getHighestPocketHeight(readings): number {
    let allHeight = [];
    for (const { nodes } of readings) {
      for (const { height } of nodes) {
        allHeight.push(height);
      }
    }
    const sorted = allHeight.sort();

    const [highest] = sorted.slice(-1);

    return highest;
  }

  private async computePocketResults({ readings }) {
    const results = [];
    const highest = this.getHighestPocketHeight(readings);
    for (const { host, nodes } of readings) {
      if (results.findIndex((result) => result.host === host) === -1) {
        results.push({ status: "", badNodes: [] });
      }

      const index = readings.findIndex((reading) => reading.host === host);

      for (const node of nodes) {
        if (highest - node.height > BlockHeightVariance.POK) {
          results[index].badNodes.push(node);
        }
      }

      if (results[index].badNodes.length === 1) {
        results[index].status = ErrorStatus.WARNING;
        results[index].conditions = ErrorConditions.NO_RESPONSE_ONE_NODE;
        results[index].details = results[index].badNodes;
      }
      if (results[index].badNodes.length > 1) {
        results[index].status = ErrorStatus.ERROR;
        results[index].conditions = ErrorConditions.NO_RESPONSE;
        results[index].details = results[index].badNodes;
      }

      if (results[index].badNodes.length === 0) {
        results[index].status = ErrorStatus.OK;
        results[index].conditions = ErrorConditions.HEALTHY;
      }

      results[index].name = host;
    }

    return results;
  }

  async getDataNodeHealth(node: INode): Promise<any> {
    const { chain, port, url, host, externalNodes, variance, threshold } = node
    const [peer] = node.peer
    const { internalIpaddress: ip } = host
    const name = `${host.name}/${chain.toLowerCase()}`
    const isNodeListening = await this.isNodeListening({ host: ip, port });
    const isRpcResponding = await this.isRpcResponding({ url, chain });
    let isPeerRpcResponding = false

    if (peer) {
      isPeerRpcResponding = await this.isRpcResponding({
        url: peer.url,
        chain,
      });
    }

    if (!isNodeListening) {
      return {
        name,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.OFFLINE,
      };
    }

    if (!isRpcResponding) {
      return {
        name,
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NO_RESPONSE,
      };
    }

    const isEthVariant = this.ethVariants.includes(chain);
    if (isEthVariant) {
      try {
        return await this.getEthNodeHealth({
          url,
          name,
          chain,
          peer,
          external: externalNodes,
          isPeerOnline: isPeerRpcResponding,
          variance,
          threshold
        });
      } catch (error) {
        return {
          name,
          status: ErrorStatus.ERROR,
          conditions: ErrorConditions.NO_RESPONSE,
          details: error,
        };
      }
    }

    if (chain === DiscoverTypes.Supported.AVA || chain === DiscoverTypes.Supported.AVATST) {
      try {
        return await this.getAvaHealth({ name, url });
      } catch (error) {
        return {
          name,
          status: ErrorStatus.ERROR,
          conditions: ErrorConditions.NO_RESPONSE,
          details: error,
        };
      }
    }

    if (chain === DiscoverTypes.Supported.HEI) {
      return await this.getHeimdallHealth({ name, url })
    }
  }

  async getDataNodesHealth(nodes: INode[]) {
    return await Promise.all(
      nodes.map(
        async (node) => await this.getDataNodeHealth(node),
      ),
    );
  }

  async getPocketNodesHealth(hosts) {
    const readings = [];
    for (const { host, nodes } of hosts) {
      if (readings.findIndex((reading) => reading.host === host) === -1) {
        readings.push({ host, nodes: [] });
      }

      const index = readings.findIndex((reading) => reading.host === host);

      for (const { name, url } of nodes) {
        const { height } = await this.getPocketHeight(url);
        readings[index].nodes.push({ name, height });
      }
    }
    return this.computePocketResults({ readings });
  }

  async getPocketNodeHealth(node: INode) {

    const refernceNodes: INode[] = await NodesModel.find({
      chain: "POKT"
    }).exec()
    const poktnodes = refernceNodes.map(({ hostname, port }) => `https://${hostname}:${port}`)
    const pocketheight = await Promise.all(await poktnodes.map(async (node) => this.getPocketHeight(node)))

    console.log(pocketheight)

    return {}
  }

  async getNodeHealth(nodes: INode[]) {

    const results = []
    for (const node of nodes) {
      if (node.chain === SupportedBlockChains.POKT) {
        results.push(await this.getPocketNodeHealth(node))
      }

      if (node.chain === SupportedBlockChains.AVA || node.chain === SupportedBlockChains.AVATST) {
        results.push(await this.getPocketNodeHealth)
      }

      if (node.chain === SupportedBlockChains.HEI) {

      }
    }


  }
}
