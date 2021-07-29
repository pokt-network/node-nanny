import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";

import { DiscordDetails, PagerDutyDetails, IncidentLevel, Messages, Titles } from "./types";

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

  private async sendDiscordMessage({ title, details }: { title: Titles; details: any }) {
    const content = `${title} \n ${details}`;
    try {
      const { status } = await this.dsClient.post(DiscordDetails.WEBHOOK_URL, { content });
      return status === 204;
    } catch (error) {
      throw new Error(`could not send alert to Discord ${error}`);
    }
  }
  private async createIncident({ title, details, urgency = IncidentLevel.HIGH }) {
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

  private async sendToBoth({ title, details }: { title: Titles; details: any }) {
    await this.createIncident({ title, details });
    await this.sendDiscordMessage({ title, details });
    return true;
  }
  async sendAlert({ channel, title, details }) {
    return {
      discord: async () => await this.sendDiscordMessage({ title, details }),
      pd: async () => await this.createIncident({ title, details }),
      both: async () => await this.sendToBoth({ title, details }),
    }[channel]();
  }

  async sendErrorAlert(error) {
    try {
      await this.sendDiscordMessage({
        title: Titles.MONITOR_ERROR,
        details: JSON.stringify(error),
      });
      return true;
    } catch (error) {
      throw new Error(`could not send error message to discord ${error}`);
    }
  }
}
