import axios, { AxiosInstance } from "axios";
import { v1, v2 } from "@datadog/datadog-api-client";

import { ApiDetails, EventTransitions } from "./types";
import { Config } from "..";

import { wait } from "../../utils";
export class Service {
  private config: Config;
  private sdkClient: v1.MonitorsApi;
  private restClient: AxiosInstance;
  private ddlogs: v2.LogsApi;
  constructor() {
    this.config = new Config();
    this.ddlogs = this.logsInitSdk();
    this.sdkClient = this.initSdk();
    this.restClient = this.initRest();
  }

  private initSdk(): v1.MonitorsApi {
    const configuration = v1.createConfiguration();
    return new v1.MonitorsApi(configuration);
  }
  private logsInitSdk(): v2.LogsApi {
    const configuration = v2.createConfiguration();
    return new v2.LogsApi(configuration);
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

  async getContainerLogs({ instance, container }) {
    let params: v2.LogsApiListLogsRequest = {
      body: {
        filter: {
          from: "now-5m",
          query: `host:${instance} container_name:${container}`,
          to: "now",
        },
        options: {
          timeOffset: -8,
        },
        sort: "-timestamp",
      },
    };

    return await (await this.ddlogs.listLogs(params)).data.map(({ attributes }) => {
      const { timestamp, service, message } = attributes
      return { timestamp, service, message }
    })
  }

  async getHealthLogs({ chain, host }) {
    let params: v2.LogsApiListLogsRequest = {
      body: {
        filter: {
          from: "now-2m",
          query: `service:"/pocket/nodemonitoring/binance-${host}/${chain}"`,
          to: "now",
        },
        options: {
          timeOffset: -8,
        },
        sort: "timestamp",
      },
    };
    return await (await this.ddlogs.listLogs(params)).data.map(({ attributes }) => {
      return { host, condition: attributes.attributes.conditions, status: attributes.attributes.status, delta: attributes.attributes.height.delta }
    })

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
    let [, , chain, host, container, backend, event] = msg.split("\n");
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
    }
  }
}
