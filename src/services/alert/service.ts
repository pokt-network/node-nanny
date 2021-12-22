import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";
import {
  AlertColor,
  SendMessageInput,
  PagerDutyDetails,
  IncidentLevel,
  PagerDutyServices,
} from "./types";
import { DataDogTypes, AlertTypes } from "../../types";
import { WebhookModel } from "../../models";

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

  async getWebhookUrl(chain: string): Promise<string> {
    const { url } = await WebhookModel.findOne({ chain }).exec();
    return url;
  }

  async sendDiscordMessage({ title, color, fields, channel }: SendMessageInput): Promise<boolean> {
    const embeds = [{ title, color, fields }];
  
    try {
      const { status } = await this.dsClient.post(channel, { embeds });
      return status === 204;
    } catch (error) {
      throw new Error(
        `could not send alert to Discord ${JSON.stringify({ error })}`,
      );
    }
  }

  async sendErrorChannel({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.ERROR,
      channel:
        process.env.MONITOR_TEST === "1"
          ? AlertTypes.Webhooks.WEBHOOK_ERRORS_TEST
          : AlertTypes.Webhooks.WEBHOOK_ERRORS,
      fields: [
        {
          name: "error",
          value: message,
        },
      ],
    });
  }

  async sendError({ title, message, chain }) {
    return await this.sendDiscordMessage({
      title,
      color: DataDogTypes.AlertColor.ERROR,
      channel: await this.getWebhookUrl(chain.toUpperCase()),
      fields: [{ name: "Error", value: message }],
    });
  }

  async sendInfo({ title, message, chain }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.INFO,
      channel: await this.getWebhookUrl(chain.toUpperCase()),
      fields: [{ name: "Info", value: message }],
    });
  }

  async sendWarn({ title, message, chain }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.WARNING,
      channel: await this.getWebhookUrl(chain.toUpperCase()),
      fields: [{ name: "Warning", value: message }],
    });
  }

  async sendSuccess({ title, message, chain }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.SUCCESS,
      channel: await this.getWebhookUrl(chain.toUpperCase()),
      fields: [{ name: "Success", value: message }],
    });
  }

  async createPagerDutyIncident({
    title,
    details,
    service = PagerDutyServices.CRITICAL,
    urgency = IncidentLevel.HIGH,
  }) {
    try {
      const { data } = await this.pdClient.post("/incidents", {
        data: {
          incident: {
            type: PagerDutyDetails.TYPE,
            title,
            service: {
              id: service,
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
