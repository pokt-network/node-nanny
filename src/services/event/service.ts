import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import path from "path";

import { DataDog, Alert, HAProxy, Config } from "..";

export class Service {
  private agentClient: AxiosInstance;
  private alert: Alert;
  private config: Config;
  private dd: DataDog;
  private lb: HAProxy;
  constructor() {
    this.agentClient = this.initAgentClient();
    this.alert = new Alert();
    this.config = new Config();
    this.dd = new DataDog();
    this.lb = new HAProxy();
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
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

  async processWebhook(raw) {
    const {
      event,
      color,
      chain,
      host,
      container,
      id,
      transition,
      type,
      title,
    } = await this.dd.parseWebhookMessage(raw);

    // if event is error and status is not synched
    // determine peer host
    // fetch peer host monitor id
    // fetch peer host status
    // if peer is ok
    //remove from lb group
    //alert

    console.log({ event, color, chain, host, container, id, transition, type, title });
  }
}
