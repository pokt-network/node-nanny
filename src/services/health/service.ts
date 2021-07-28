import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";

import { Errors, EthVariants, NCResponse, BlockHeightVariance } from "./types";
import { hexToDec } from "../../utils";


export class Service {
  private rpc: AxiosInstance;
  private ethVariants;
  constructor() {
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
      throw new Error(`could not contact blockchain node ${error}`);
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
      throw new Error(`could not contact blockchain node ${error}`);
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
      throw new Error(`could not contact blockchain node ${error}`);
    }
  }

  getBestBlockHeight({ readings, variance }) {
    if (readings.length === 1) {
      return readings[0];
    }
    const sorted = readings.sort()
    const [last] = sorted.slice(-1);
    const [secondLast] = sorted.slice(-2);
    if (last - secondLast < variance) {
      return sorted.pop()
    } else {
      throw Error(`block hight not within variance ${readings}`)
    }
  }

  async getReferenceBlockHeight({ endpoints, chain }): Promise<number> {
    const results = endpoints.map((endpoint) => this.getBlockHeight(endpoint));
    const resolved = await Promise.all(results);
    const readings = resolved.map(({ result }) => hexToDec(result))
    const variance = BlockHeightVariance[chain]
    const height = this.getBestBlockHeight({ readings, variance })
    return height
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

  private async getEthNodeHealth({ ip, port, chain, peer, external }) {
    const refernceUrls = external;
    if (peer) {
      const { ip, port } = peer;
      refernceUrls.push(`http://${ip}:${port}`)
    }
    const url = `http://${ip}:${port}`
    const [internalBh, externalBh, ethSyncing, peers] = await Promise.all([
      this.getBlockHeight(url),
      this.getReferenceBlockHeight({ endpoints: refernceUrls, chain }),
      this.getEthSyncing(url),
      this.getPeers(url),
    ]);

    const internalHeight = hexToDec(internalBh.result);
    const externalHeight = externalBh;
    const numPeers = hexToDec(peers.result);
    const ethSyncingResult = ethSyncing.result;

    return {
      ethSyncing: ethSyncingResult,
      peers: numPeers,
      height: {
        internalHeight,
        externalHeight,
        delta: externalHeight - internalHeight,
      },
    }
  }
  async getNodeHealth({ node, peer, external }) {
    const { ip, port, chain } = node;
    const isOnline = await this.isNodeOnline({ host: ip, port });
    if (!isOnline) return Errors.OFFLINE;
    const isEthVariant = this.ethVariants.includes(chain);
    if (isEthVariant) {
      return await this.getEthNodeHealth({ ip, port, chain, peer, external });
    }

    return {}
  }
}
