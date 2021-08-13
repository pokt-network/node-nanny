import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import path from "path";

import { DataDog } from "..";
import {
  DiscordDetails,
  PagerDutyDetails,
  IncidentLevel,
  DataDogAlertColor,
  Titles,
  LinkTitles,
  HostsForReboot,
} from "./types";

export class Service {
  private dd: DataDog;
  private dsClient: AxiosInstance;
  private agentClient: AxiosInstance;
  private pdClient: any;
  constructor() {
    this.agentClient = this.initAgentClient();
    this.dd = new DataDog();
    this.dsClient = this.initDsClient();
    this.pdClient = api({ token: process.env.PAGER_DUTY_API_KEY });
  }

  private initDsClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
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

  async sendRichDiscordMessage({ title, msg, color, type, monitor = null, logs = null }) {
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

  async processWebhookforReboot({ title, type, id }) {
    if (type === "error") {
      let namespace = title.split("*")[1];
      const [, node, host] = namespace.split("_");
      let url = HostsForReboot[host.split("")[1].toUpperCase()];

      url = `http://${url}:3001/webhook/datadog/monitor/reboot`;

      await this.dsClient.post(DiscordDetails.WEBHOOK_URL, {
        embeds: [
          {
            title,
            color: DataDogAlertColor.ERROR,
            fields: [
              {
                name: type.toUpperCase(),
                value: `${node} ${host} was unresponsive or offline, rebooting...`,
              },
            ],
          },
        ],
      });

      if (!(await (await this.dd.getMonitor(id)).options.silenced)) {
        try {
          const minutes = 10;
          await this.dd.muteMonitor({ id, minutes });
          const { data } = await this.agentClient.post(url, { name: node });
          const { info } = data;

          const embeds = [
            {
              title,
              color: DataDogAlertColor.SUCCESS,
              fields: [
                {
                  name: type.toUpperCase(),
                  value: `${node} ${host} was unresponsive or offline, it has been rebooted \n ${info} \n the monitor will be on  mute for the next ${minutes} minutes`,
                },
              ],
            },
          ];

          const { status } = await this.dsClient.post(DiscordDetails.WEBHOOK_URL, { embeds });
          return status === 204;
        } catch (error) {
          throw new Error(`could not process webhook ${error}`);
        }
      }
      return;
    }
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
