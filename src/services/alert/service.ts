import axios, { AxiosInstance } from "axios";
import { SendMessageInput } from "./types";

export class Service {
  private dsClient: AxiosInstance;
  constructor() {
    this.dsClient = this.initDsClient();
  }

  private initDsClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  async sendDiscordMessage({ title, color, fields, channel }: SendMessageInput): Promise<boolean> {
    const embeds = [{ title, color, fields }];
    try {
      const { status } = await this.dsClient.post(channel, { embeds });
      return status === 204;
    } catch (error) {
      throw new Error(`could not send alert to Discord ${error}`);
    }
  }
}
