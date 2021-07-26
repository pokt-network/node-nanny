import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";

enum NCResponse {
  SUCCESS = "succeeded!",
}

class Service {
  private rpc: AxiosInstance;
  constructor() {
    this.rpc = this.initRpcClient();
  }

  private initRpcClient() {
    const instance = axios.create();
    instance.defaults.headers.common["Content-Type"] = "application/json";
    return instance;
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

  async getBlockHeight({ ip, port, chain = "eth", https = "false" }) {
    let url: string;
    https === "true" ? (url = `https://${ip}`) : (url = `http://${ip}:${port}`);
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
}
export { Service };
