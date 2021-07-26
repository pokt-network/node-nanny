import axios, { AxiosInstance } from "axios";

enum WebHookDetails {
  BASE_URL = "***REMOVED***",
}

class Service {
  private client: AxiosInstance;
  constructor() {
    this.client = this.initClient();
  }

  private initClient() {
    const instance = axios.create();
    instance.defaults.baseURL = WebHookDetails.BASE_URL;
    instance.defaults.headers.common["Content-Type"] = "application/json";

    return instance;
  }

  async sendMessage(content) {
    try {
      const { status } = await this.client.post(WebHookDetails.BASE_URL, { content });
      return status === 204;
    } catch (error) {
      throw new Error(`could not send alert to Discord ${error}`);
    }
  }
}
export { Service };
