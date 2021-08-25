import axios, { AxiosInstance } from "axios";
import { DiscordDetails, DiscordInput } from "./types";

const WEBHOOK_URL =
  process.env.NODE_ENV === "dev" ? DiscordDetails.WEBHOOK_TEST : DiscordDetails.WEBHOOK_URL;

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

  async sendDiscordMessage({ title, color, fields }: DiscordInput): Promise<boolean> {
    const embeds = [{ title, color, fields }];
    try {
      const { status } = await this.dsClient.post(WEBHOOK_URL, { embeds });
      return status === 204;
    } catch (error) {
      throw new Error(`could not send alert to Discord ${error}`);
    }
  }
}
