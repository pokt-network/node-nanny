import axios, { AxiosInstance } from "axios";
import { v1 } from "@datadog/datadog-api-client";
import {
  ApiDetails,
  AlertColor,
  LogTypes,
  LogGroupList,
  Thresholds,
  Webhooks,
  WebhookOutput,
} from "./types";

export class Service {
  private sdkClient: v1.MonitorsApi;
  private restClient: AxiosInstance;
  constructor() {
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
  async createMonitor({
    name,
    type = LogTypes.LOG,
    logGroup,
    critical = Thresholds.CRITICAL,
    warning = Thresholds.WARNING,
    webhook = Webhooks.API_PRODUCTION,
  }) {
    const params: v1.MonitorsApiCreateMonitorRequest = {
      body: {
        name,
        type,
        options: {
          thresholds: { critical, warning },
        },
        query: `logs("status:error source:\\"${logGroup}\\"").index("*").rollup("count").last("5m") > 2`,
        message: webhook,
      },
    };

    return await this.sdkClient.createMonitor(params);
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
  async deleteMonitor({ monitorId }) {
    return await this.sdkClient.deleteMonitor({ monitorId });
  }

  async clearAllMonitors() {
    /** add an exclusion list here so dont nuke the other guys monitors! */
    const list = await this.getAllMonitors();
    const ids = list.map(({ id }) => id);
    return await Promise.all(ids.map(async (monitorId) => await this.deleteMonitor({ monitorId })));
  }

  async createMonitors(list: LogGroupList[]): Promise<boolean> {
    for (const { name, logGroup } of list) {
      await this.createMonitor({ name, logGroup });
    }
    return true;
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
    let [, , chain, host, container, event, backend] = msg.split("\n");
    const color = AlertColor[type.toUpperCase()];
    chain = chain.split("chain_")[1];
    host = host.split("host_")[1];
    container = container.split("container_")[1];
    event = event.split("event_")[1];
    backend = backend.split("backend_")[1];
    return { event, color, host, chain, container, id, transition, type, title, backend, link };
  }
}
