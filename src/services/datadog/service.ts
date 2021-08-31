import axios, { AxiosInstance } from "axios";
import { v1 } from "@datadog/datadog-api-client";

import { ApiDetails, EventTransitions } from "./types";
import { Config } from "..";

import { wait } from "../../utils";
export class Service {
  private config: Config;
  private sdkClient: v1.MonitorsApi;
  private restClient: AxiosInstance;
  constructor() {
    this.config = new Config();
    this.sdkClient = this.initSdk();
    this.restClient = this.initRest();
  }

  private initSdk(): v1.MonitorsApi {
    const configuration = v1.createConfiguration();
    return new v1.MonitorsApi(configuration);
  }

  private initRest() {
    return axios.create({
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": process.env.DD_API_KEY,
        "DD-APPLICATION-KEY": process.env.DD_APP_KEY,
      },
      baseURL: ApiDetails.BASE_URL,
    });
  }

  async getMonitor(id) {
    return await this.sdkClient.getMonitor({ monitorId: id });
  }

  async getMonitorStatus(id) {
    const { overallState } = await this.getMonitor(id);
    return overallState;
  }

  async getAllMonitors() {
    return await this.sdkClient.listMonitors();
  }

  async getMonitorsByTag(monitorTags) {
    return await this.sdkClient.listMonitors({ monitorTags });
  }

  async deleteMonitor({ monitorId }) {
    return await this.sdkClient.deleteMonitor({ monitorId });
  }

  async muteMonitor({ id, minutes }) {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + minutes * 60000);
    const ts = parseInt((new Date(futureDate).getTime() / 1000).toFixed(0));
    try {
      const { options } = await this.getMonitor(id);
      if (options.silenced.hasOwnProperty("*")) {
        return -1;
      }
      const { data } = await this.restClient.post(`/monitor/${id}/mute?end=${ts}`);
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  parseWebhookMessage({ msg, id, transition, type, title, link }) {
    let event;

    let [, , chain, host, container, backend] = msg.split("\n");

    if (transition !== EventTransitions.RE_TRIGGERED) {
      event = msg.split("\n")[6];
      console.log(event);
    } else {
      event = msg.split("\n")[13];
    }

    chain = chain.split("chain_")[1];
    host = host.split("host_")[1];
    container = container.split("container_")[1];
    event = event.split("event_")[1];
    backend = backend.split("backend_")[1];
    return { event, host, chain, container, id, transition, type, title, backend, link };
  }

  async storeMonitorIds() {
    const monitors = await this.getMonitorsByTag("Smart_Monitor");

    const ids = monitors.map((monitor) => {
      return {
        id: monitor.id,
        chain: monitor.message.split("\n")[1].split("_")[1],
        host: monitor.message.split("\n")[2].split("_")[1],
      };
    });

    for (const { id, chain, host } of ids) {
      const key = `/pocket/monitoring/config/monitor/${chain}/${host.toUpperCase()}`;
      await wait(1000)
      await this.config.setParameter({ key, value: id });

      console.log(key);
    }
  }
}
