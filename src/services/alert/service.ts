import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";
import { AlertColor, SendMessageInput, PagerDutyDetails, IncidentLevel } from "./types";
import { DataDogTypes, AlertTypes } from "../../types"

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
      throw new Error(`could not send alert to Discord ${{ error, title, color, fields, channel }}`);
    }
  }

  async sendErrorChannel({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.ERROR,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_ERRORS_TEST : AlertTypes.Webhooks.WEBHOOK_ERRORS,
      fields: [
        {
          name: "error",
          value: message,
        },
      ],
    });
  }

  async sendErrorCritical({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: DataDogTypes.AlertColor.ERROR,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_CRITICAL_TEST : AlertTypes.Webhooks.WEBHOOK_CRITICAL,
      fields: [
        {
          name: "Error",
          value: message,
        }
      ]
    });
  }

  async sendLogs({ title, fields }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.INFO,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_LOGS_TEST : AlertTypes.Webhooks.WEBHOOK_LOGS,
      fields
    });
  }

  async sendInfo({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.INFO,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_NON_CRITICAL_TEST : AlertTypes.Webhooks.WEBHOOK_NON_CRITICAL,
      fields: [
        {
          name: "Info",
          value: message
        },
      ],
    });
  }

  async sendWarn({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.WARNING,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_NON_CRITICAL_TEST : AlertTypes.Webhooks.WEBHOOK_NON_CRITICAL,
      fields: [
        {
          name: "Warning",
          value: message
        },
      ],
    });
  }

  async sendSuccess({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.SUCCESS,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_NON_CRITICAL_TEST : AlertTypes.Webhooks.WEBHOOK_NON_CRITICAL,
      fields: [
        {
          name: "Success",
          value: message
        },
      ],
    });
  }

  async sendSuccessToCritical({ title, message }) {
    return await this.sendDiscordMessage({
      title,
      color: AlertColor.SUCCESS,
      channel: (process.env.MONITOR_TEST === "1") ? AlertTypes.Webhooks.WEBHOOK_CRITICAL_TEST : AlertTypes.Webhooks.WEBHOOK_CRITICAL,
      fields: [
        {
          name: "Success",
          value: message
        },
      ],
    });
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