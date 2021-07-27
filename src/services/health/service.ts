import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";

import { Config } from "..";
import { Errors, EthVariants, ExternalResponse, NCResponse } from "./types";
import { hexToDec } from "../../utils";
import { ExternalEndPoints } from "../config/types";

export class Service {
  private config: Config;
  private rpc: AxiosInstance;
  private ethVariants;
  constructor() {
    this.config = new Config();
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

  private async getExternalBlockHeightByChain(chain: ExternalEndPoints): Promise<ExternalResponse> {
    //get external endpoints from ssm
    let { Value } = await this.config.getParamByKey(ExternalEndPoints[chain]);
    const endpoints = Value.split(",");

    //fetch and wait for all to complete
    let results = endpoints.map((endpoint) => this.getBlockHeight(endpoint));
    const resolved = await Promise.all(results);

    // consensus "score" is based on the number of dupe keys removed, ie number of identical values,
    // best case is score of 1 means all numbers were the same
    // worst case is score === length of results (3+) none were the same but still within +/- 1
    const { size: score } = new Map(resolved.map(({ result }, index) => [hexToDec(result), index]));

    // if two highest are within +/- 1 return the highest number
    const sorted = resolved.map(({ result }) => hexToDec(result)).sort();
    const last = sorted[sorted.length - 1];
    const secondLast = sorted[sorted.length - 2];
    if (last - secondLast === 1 || last - secondLast === 0) {
      return { height: last, score };
    } else {
      throw new Error("could not get consensus");
    }
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

  private async getEthNodeHealth({ ip, port, chain }) {
    const url = `http://${ip}:${port}`;

    const [internal, external, ethSyncing, peers] = await Promise.all([
      this.getBlockHeight(url),
      this.getExternalBlockHeightByChain(chain),
      this.getEthSyncing(url),
      this.getPeers(url),
    ]);

    const internalHeight = hexToDec(internal.result);
    let { height: externalHeight, score: consensusScore } = external;
    const numPeers = hexToDec(peers.result);
    const ethSyncingResult = ethSyncing.result;

    return {
      ethSyncing:  ethSyncingResult,
      peers: numPeers,
      height: {
        internalHeight,
        externalHeight,
        delta: externalHeight - internalHeight,
        consensusScore,
      },
    };
  }
  async getNodeHealth({ chain, ip, port }) {
    //todo change "chain" to "chain" for consistency
    const isOnline = await this.isNodeOnline({ host: ip, port });
    const isEthVariant = this.ethVariants.includes(chain);
    if (isOnline && isEthVariant) {
      return await this.getEthNodeHealth({ ip, port, chain });
    }
  }
}
