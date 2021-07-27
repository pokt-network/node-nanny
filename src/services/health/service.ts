import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import { Config } from "..";
import { NCResponse } from "./types";
import { hexToDec } from "../../utils";

export class Service {
  private rpc: AxiosInstance;
  constructor() {
    this.rpc = this.initClient();
  }

  private initClient() {
    const instance = axios.create();
    instance.defaults.headers.common["Content-Type"] = "application/json";
    return instance;
  }

  async getBlockHeight(url) {
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

  async getExternalEndpointsByChain(chain: string): Promise<string[]> {
    const config = new Config.Service();
    let { Value } = await config.getParamByKey(Config.Types.ConfigPrefix.EXTERNAL_ENDPOINTS_ETH);
    return Value.split(",");
  }

  async getExternalBlockHeightByChain() {
    const endpoints = await this.getExternalEndpointsByChain("");
    let results = endpoints.map((endpoint) => this.getBlockHeight(endpoint));
    const resolved = await Promise.all(results);

    const { size: score } = new Map(resolved.map(({ result }, index) => [hexToDec(result), index]));

    /*
     ^^^^
     consensus score is based on the number of dupe keys removed, ie number of identical values,
     best case is score of 1 means all numbers were the same
     worst case is score === length of results (3+) none were the same but still within +/- 1
    */

    const sorted = resolved.map(({ result }) => hexToDec(result)).sort();
    const last = sorted[sorted.length - 1];
    const secondLast = sorted[sorted.length - 2];

    // if two highest are within +/- 1 return the highest number

    if (last - secondLast === 1 || last - secondLast === 0) {
      return { height: last, score };
    } else {
      throw new Error("could not get consensus");
    }
  }
  async nc({ host, port }): Promise<string> {
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

  async isNodeOnline({ host, port }) {
    try {
      const nc = await this.nc({ host, port });
      let status = nc.split(" ");
      return status[status.length - 1].includes(NCResponse.SUCCESS);
    } catch (error) {
      return false;
    }
  }
}
