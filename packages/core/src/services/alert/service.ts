import axios, { AxiosInstance } from "axios";
import { FilterQuery } from "mongoose";
import { api as pagerDutyApi } from "@pagerduty/pdjs";

import { WebhookModel, IWebhook } from "../../models";
import { AlertTypes } from "../../types";
import { colorLog } from "../../utils";
import {
  AlertColor,
  SendMessageInput,
  PagerDutyDetails,
  IncidentLevel,
  PagerDutyServices,
} from "./types";

import env from "../../environment";

export class Service {
  private discordClient: AxiosInstance;
  private pagerDutyClient: any;

  constructor() {
    this.discordClient = axios.create({
      headers: { "Content-Type": "application/json" },
    });
    this.pagerDutyClient = pagerDutyApi({ token: env("PAGER_DUTY_API_KEY") });
  }

  /* ----- Discord Alerts ----- */
  // sendErrorChannel = async ({ title, message }: AlertTypes.IErrorChannelAlertParams) => {
  //   colorLog(`${title}\n${message}`, "red");
  //   try {
  //     return await this.sendDiscordMessage({
  //       title,
  //       color: AlertColor.ERROR,
  //       channel: env("MONITOR_TEST")
  //         ? AlertTypes.Webhooks.WEBHOOK_ERRORS_TEST
  //         : AlertTypes.Webhooks.WEBHOOK_ERRORS,
  //       fields: [{ name: "Error", value: this.trimMessage(message) }],
  //     });
  //   } catch (error) {
  //     console.error(error?.message);
  //   }
  // };

  sendError = async ({
    title,
    message,
    chain,
    location,
    frontend,
  }: AlertTypes.IAlertParams) => {
    colorLog(`${title}\n${message}`, "red");
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.ERROR,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: "Error", value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendInfo = async (
    { title, message, chain, location, frontend }: AlertTypes.IAlertParams,
    color?: AlertColor,
  ) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: color || AlertColor.INFO,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: "Info", value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendWarn = async ({
    title,
    message,
    chain,
    location,
    frontend,
  }: AlertTypes.IAlertParams) => {
    colorLog(`${title}\n${message}`, "yellow");
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.WARNING,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: "Warning", value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendSuccess = async ({
    title,
    message,
    chain,
    location,
    frontend,
  }: AlertTypes.IAlertParams) => {
    try {
      colorLog(`${title}\n${message}`, "green");
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.SUCCESS,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: "Success", value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  async sendDiscordMessage({
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

  private async getWebhookUrl(
    chain: string,
    location: string,
    frontend = false,
  ): Promise<string> {
    let query: FilterQuery<IWebhook>;

    if (frontend) {
      query = { chain: "FRONTEND_ALERT" };
    } else if (env("PNF") && chain === "POKT-DIS") {
      query = { chain };
    } else {
      query = { chain, location };
    }

    const { url } = await WebhookModel.findOne(query);
    return url;
  }

  private trimMessage(message: string): string {
    if (message.length >= 1950) {
      const trimmedDisclaimer =
        "...\nMessage trimmed to not exceed Discord's character limit.";
      return message.substring(0, 1950 - trimmedDisclaimer.length) + trimmedDisclaimer;
    } else {
      return message;
    }
  }

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
}
