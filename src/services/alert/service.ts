import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import path from "path";

import {
  DiscordDetails,
  PagerDutyDetails,
  IncidentLevel,
  DataDogAlertColor,
  Titles,
  LinkTitles,
} from "./types";

export class Service {
  private dsClient: AxiosInstance;
  private pdClient: any;
  constructor() {
    this.dsClient = this.initDsClient();
    this.pdClient = api({ token: process.env.PAGER_DUTY_API_KEY });
  }

  private initDsClient() {
    const instance = axios.create();
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

  async sendRichDiscordMessage({ title, msg, color, type, monitor, logs }) {
    const embeds = [
      {
        title,
        color,
        fields: [
          {
            name: type.toUpperCase(),
            value: msg,
          },
        ],
      },
      monitor,
      logs,
    ];
    try {
      const { status } = await this.dsClient.post(DiscordDetails.WEBHOOK_URL, { embeds });
      return status === 204;
    } catch (error) {
      throw new Error(`could not send alert to Discord ${error}`);
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

  async processWebhookforReboot(rawMessage) {
    console.log(rawMessage);
  }
  async processWebhook(rawMessage) {
    //todo make this better
    let { type, title, msg } = rawMessage;
    let color = DataDogAlertColor[type.toUpperCase()];
    const split = msg.split("\n");
    let [links] = split.splice(-1);
    split.splice(0, 3);
    msg = split;
    msg.length = 3;
    msg[1] = "\n";
    msg = msg.join("");

    links = links.split("·");
    let [monitor, , logs] = links;

    let [monitorURl] = monitor.split("(").splice(-1);
    monitor = monitorURl.split(")")[0];

    let [logsURl] = logs.split("(").splice(-1);
    logs = logsURl.split(")")[0];

    monitor = {
      title: LinkTitles.MONITOR,
      url: monitor,
    };

    logs = {
      title: LinkTitles.LOGS,
      url: logs,
    };

    return this.sendRichDiscordMessage({ title, msg, color, type, monitor, logs });
  }

  rebootNode(name) {
    const script = path.resolve(__dirname, "../../../scripts/agent_reboot.sh");
    return new Promise((resolve, reject) => {
      exec(`sh ${script} ${name}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`nc ${error}`);
          reject(`error: ${error.message}`);
        }
        if (stderr) {
          resolve(stderr);
        }
        resolve(stdout);
      });
    });
  }
}
