import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";

import { DiscordDetails, PagerDutyDetails } from "./types";

export class Service {
  private dsClient: AxiosInstance;
  private pdClient: any;
  constructor() {
    this.dsClient = this.initDsClient();
    this.pdClient = api({ token: process.env.PAGER_DUTY_API_KEY });
  }

  private initDsClient() {
    const instance = axios.create();
    instance.defaults.baseURL = DiscordDetails.WEBHOOK_URL;
    instance.defaults.headers.common["Content-Type"] = "application/json";

    return instance;
  }

  async sendDiscordMessage(content) {
    try {
      const { status } = await this.dsClient.post(DiscordDetails.WEBHOOK_URL, { content });
      return status === 204;
    } catch (error) {
      throw new Error(`could not send alert to Discord ${error}`);
    }
  }
  async createIncident({ title, urgency, details }) {
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
