import axios, { AxiosInstance } from "axios";
import { api as pagerDutyApi } from "@pagerduty/pdjs";

import { AlertTypes } from "../../types";
import { WebhookModel } from "../../models";
import {
  AlertColor,
  SendMessageInput,
  PagerDutyDetails,
  IncidentLevel,
  PagerDutyServices,
} from "./types";

export class Service {
  private discordClient: AxiosInstance;
  private pagerDutyClient: any;

  constructor() {
    this.discordClient = axios.create({
      headers: { "Content-Type": "application/json" },
    });
    this.pagerDutyClient = pagerDutyApi({ token: process.env.PAGER_DUTY_API_KEY });
  }

  /* ----- Discord Alerts ----- */
  sendErrorChannel = async ({ title, message }: AlertTypes.IAlertParams) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.ERROR,
        channel:
          process.env.MONITOR_TEST === "1"
            ? AlertTypes.Webhooks.WEBHOOK_ERRORS_TEST
            : AlertTypes.Webhooks.WEBHOOK_ERRORS,
        fields: [{ name: "Error", value: message }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendError = async ({ title, message, chain }: AlertTypes.IAlertParams) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.ERROR,
        channel: await this.getWebhookUrl(chain.toUpperCase()),
        fields: [{ name: "Error", value: message }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendInfo = async ({ title, message, chain }: AlertTypes.IAlertParams) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.INFO,
        channel: await this.getWebhookUrl(chain),
        fields: [{ name: "Info", value: message }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendWarn = async ({ title, message, chain }: AlertTypes.IAlertParams) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.WARNING,
        channel: await this.getWebhookUrl(chain.toUpperCase()),
        fields: [{ name: "Warning", value: message }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendSuccess = async ({ title, message, chain }: AlertTypes.IAlertParams) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.SUCCESS,
        channel: await this.getWebhookUrl(chain.toUpperCase()),
        fields: [{ name: "Success", value: message }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  /* ----- Pager Duty Alert ----- */
  async createPagerDutyIncident({
    title,
    details,
    service = PagerDutyServices.CRITICAL,
    urgency = IncidentLevel.HIGH,
  }) {
    try {
      const { data } = await this.pagerDutyClient.post("/incidents", {
        data: {
          incident: {
            title,
            urgency,
            type: PagerDutyDetails.TYPE,
            service: { id: service, type: PagerDutyDetails.SERVICE_TYPE },
            body: { type: PagerDutyDetails.BODY_TYPE, details },
          },
        },
        headers: { From: PagerDutyDetails.FROM },
      });
      return data;
    } catch (error) {
      throw new Error(`Could not create PD incident. ${error}`);
    }
  }

  /* ----- Private Methods ----- */
  private async sendDiscordMessage({
    title,
    color,
    fields,
    channel,
  }: SendMessageInput): Promise<boolean> {
    const embeds = [{ title, color, fields }];

    try {
      const { status } = await this.discordClient.post(channel, { embeds });
      return status === 204;
    } catch (error) {
      throw new Error(`Could not send alert to Discord. ${error}`);
    }
  }

  private async getWebhookUrl(chain: string): Promise<string> {
    const { url } = await WebhookModel.findOne({ chain }).exec();
    return url;
  }
}
