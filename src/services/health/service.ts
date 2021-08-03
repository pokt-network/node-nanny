import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";

import { Alert } from "../../services";
import {
  ErrorConditions,
  ErrorStatus,
  EthVariants,
  NCResponse,
  BlockHeightVariance,
  BlockHeightThreshold,
  HealthResponse,
} from "./types";

import { DiscoverTypes } from "../../types";
import { hexToDec, wait } from "../../utils";

export class Service {
  private alert: Alert;
  private rpc: AxiosInstance;
  private ethVariants;
  constructor() {
    this.alert = new Alert();
    this.rpc = this.initClient();
    this.ethVariants = Object.keys(EthVariants);
  }

  private initClient() {
    const instance = axios.create();
    instance.defaults.headers.common["Content-Type"] = "application/json";
    return instance;
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
      console.error(`could not contact blockchain node ${error}`);
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
      console.error(`could not contact blockchain node ${error}`);
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
      console.error(`could not contact blockchain node ${error}`);
    }
  }

  async getAvaHealth(url): Promise<HealthResponse> {
    try {
      const { data } = await this.rpc.post(`${url}/ext/health`, {
        jsonrpc: "2.0",
        id: 1,
        method: "health.getLiveness",
      });

      const { result } = data;
      if (result.healthy) {
        return {
          conditions: ErrorConditions.HEALTHY,
          status: ErrorStatus.OK,
          health: result,
        };
      } else {
        return {
          conditions: ErrorConditions.NOT_SYNCHRONIZED,
          status: ErrorStatus.ERROR,
          health: result,
        };
      }
    } catch (error) {
      console.error(`could not contact blockchain node ${error}`);
    }
  }

 private async getPocketHeight(url) {
    try {
      const { data } = await this.rpc.post(`${url}/v1/query/height`, {});
      return data;
    } catch (error) {
      console.error(`could not contact pocket node ${error}`);
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

  private async getReferenceBlockHeight({ endpoints, chain }): Promise<number> {
    const results = endpoints.map((endpoint) => this.getBlockHeight(endpoint));
    const resolved = await Promise.all(results);
    const readings = resolved.map(({ result }) => hexToDec(result));
    const variance = BlockHeightVariance[chain];
    console.log("getBestBlockHeight", chain);
    const height = this.getBestBlockHeight({ readings, variance });
    return height;
  }

  private async nc({ host, port }): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`nc -vz -q 5 ${host} ${port}`, (error, stdout, stderr) => {
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

  private async isNodeOnline({ host, port }) {
    try {
      const nc = await this.nc({ host, port });
      let status = nc.split(" ");
      return status[status.length - 1].includes(NCResponse.SUCCESS);
    } catch (error) {
      return false;
    }
  }

  private async getEthNodeHealth({ ip, port, chain, peer, external }): Promise<HealthResponse> {
    const referenceUrls = external;
    if (peer) {
      const { ip, port } = peer;
      referenceUrls.push(`http://${ip}:${port}`);
    }
    const url = `http://${ip}:${port}`;
    const [internalBh, externalBh, ethSyncing, peers] = await Promise.all([
      this.getBlockHeight(url),
      this.getReferenceBlockHeight({ endpoints: referenceUrls, chain }),
      this.getEthSyncing(url),
      this.getPeers(url),
    ]);

    const internalHeight = hexToDec(internalBh.result);
    const externalHeight = externalBh;
    const numPeers = hexToDec(peers.result);
    const ethSyncingResult = ethSyncing.result;
    const delta = externalHeight - internalHeight;

    let status = ErrorStatus.OK;
    let conditions = ErrorConditions.HEALTHY;
    const threshold = Number(BlockHeightThreshold[chain]);

    if (delta > threshold) {
      status = ErrorStatus.ERROR;
      conditions = ErrorConditions.NOT_SYNCHRONIZED;
    }
    return {
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
  }

  private async getPocketHealthDeepScan({ nodes, highest }) {
    const badNodes = [];
    for (const node of nodes) {
      const { height } = await this.getPocketHeight(node.url);
      if (highest - height < BlockHeightVariance.POK) {
        badNodes.push(node);
      }
    }
    return badNodes;
  }

  private async getPocketHealthQuickScan(nodes) {
    const allHeight = await Promise.all(
      nodes.map(async ({ url }) => await this.getPocketHeight(url)),
    );
    const sorted = allHeight.map(({ height }: { height: number }) => height).sort();
    const [highest] = sorted.slice(-1);
    const status = sorted.every((height) => highest - height < BlockHeightVariance.POK);
    return status ? { OK: true, highest: highest } : { OK: false, highest: highest };
  }

  async getPocketHealth(nodes) {
    const isPocketHealthyQuickScan = await this.getPocketHealthQuickScan(nodes);
    if (isPocketHealthyQuickScan.OK) {
      return {
        status: ErrorStatus.OK,
        conditions: ErrorConditions.HEALTHY,
      };
    } else {
      const { highest } = isPocketHealthyQuickScan;
      const deepScan = await this.getPocketHealthDeepScan({
        nodes,
        highest,
      });

      return {
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.NOT_SYNCHRONIZED,
        details: deepScan,
      };
    }
  }

  async getNodeHealth({ node, peer, external }): Promise<HealthResponse> {
    const { ip, port, chain } = node;
    const isOnline = await this.isNodeOnline({ host: ip, port });
    const isPeerOnline = await this.isNodeOnline({ host: peer.ip, port: peer.port });

    if (!isOnline) {
      return {
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.OFFLINE,
      };
    }

    if (!isPeerOnline) {
      return {
        status: ErrorStatus.ERROR,
        conditions: ErrorConditions.PEER_OFFLINE,
      };
    }

    const isEthVariant = this.ethVariants.includes(chain);
    if (isEthVariant) {
      return await this.getEthNodeHealth({ ip, port, chain, peer, external });
    }

    if (chain === DiscoverTypes.Supported.AVA) {
      return await this.getAvaHealth(`http://${ip}:${port}`);
    }
  }
}
