import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";
import { SendMessageInput, PagerDutyDetails, IncidentLevel } from "./types";

export class Service {
  private dsClient: AxiosInstance;
  private pdClient: any;
  constructor() {
    this.dsClient = this.initDsClient();
    this.pdClient = api({ token: process.env.PAGER_DUTY_API_KEY });
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
  async createPagerDutyIncident({ title, details, urgency = IncidentLevel.HIGH }) {
    try {
      const { data } = await this.pdClient.post("/incidents", {
        data: {
          incident: {
            type: PagerDutyDetails.TYPE,
            title,
            service: {
              id: PagerDutyDetails.SERVICE_ID,
              type: PagerDutyDetails.SERVICE_TYPE,
            },
            urgency,
            body: {
              type: PagerDutyDetails.BODY_TYPE,
              details,
            },
          },
        },
        headers: {
          From: PagerDutyDetails.FROM,
        },
      });
      return data;
    } catch (error) {
      throw new Error(`could not create pd incident ${error}`);
    }
  }
}
