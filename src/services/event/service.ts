import { api } from "@pagerduty/pdjs";
import axios, { AxiosInstance } from "axios";
import { exec } from "child_process";
import path from "path";

import { DataDog } from "..";

export class Service {
  private dd: DataDog;
  private dsClient: AxiosInstance;
  private agentClient: AxiosInstance;
  constructor() {
    this.agentClient = this.initAgentClient();
    this.dd = new DataDog();
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
}
