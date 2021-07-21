import axios, { AxiosInstance } from "axios";

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

  async getBlockHeight({ ip, port, chain = "eth", https = false }) {
    let url: string;

    https === true ? (url = `https://${ip}`) : (url = `http://${ip}:${port}`);

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
