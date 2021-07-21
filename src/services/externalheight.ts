import axios, { AxiosInstance } from "axios";

enum EtherScanDetails {
  BASE_URL = "https://api.etherscan.io/",
}

class Service {
  private eth: AxiosInstance;
  constructor() {
    this.eth = this.initEthClient();
  }

  private initEthClient() {
    const instance = axios.create();
    instance.defaults.baseURL = EtherScanDetails.BASE_URL;
    instance.defaults.headers.common["Content-Type"] = "application/json";
    instance.defaults.params = {
      apikey: process.env.ETHERSCAN_API_KEY,
    };

    return instance;
  }

  async getBlockHeight(type) {
    try {
      const { data } = await this.eth.post("/api?module=proxy&action=eth_blockNumber", {});
      return data;
    } catch (error) {
      throw new Error(`could not contact external API ${error}`);
    }
  }
}
export { Service };
