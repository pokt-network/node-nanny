import axios, { AxiosInstance } from "axios";
import { v1 } from "@datadog/datadog-api-client";
import {
  ApiDetails,
  AlertColor,
  LogTypes,
  LogGroupList,
  Thresholds,
  Webhooks,
  EventTransitions,
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
    webhook = Webhooks.API_DEV,
  }) {
    const params: v1.MonitorsApiCreateMonitorRequest = {
      body: {
        name,
        type,
        options: {
          thresholds: {
            critical: 1,
            warning: null,
            comparison: ">",
            period: {
              name: "1 minute average",
              value: "last_1m",
              text: "1 minute",
              no_data_timeframe: 2,
              seconds: 60,
              digit: 1,
              unit: "minutes",
              tense: "last",
            },
            timeAggregator: "avg",
          },

          enable_logs_sample: true,
          notify_audit: false,
          aggregation: {
            metric: "count",
            type: "count",
          },
          restriction_query: null,
          locked: true,
          renotify_interval: 10,
          include_tags: true,
          silenced: {},
          notify_no_data: false,
          groupby_simple_monitor: false,
          escalation_message:
            "@webhook-Events_Dev\nchain_xdai\nhost_2a\ncontainer_dai1\nbackend_daimainnet\nevent_{{@conditions.name}}_NOT_RESOLVED",
          new_group_delay: 60,
        },
        query: `logs("status:error source:\\"${logGroup}\\"").index("*").rollup("count").last("5m") > 2`,
        message:
          "@webhook-Events_Dev\nchain_xdai\nhost_2a\ncontainer_dai1\nbackend_daimainnet\nevent_{{@conditions.name}}",
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
}
const monitor = {
  id: 1867792,
  name: "Template",
  type: "log alert",
  query:
    'logs("status:error source:\\"/pocket/nodemonitoring/shared-2b/kov\\"").index("*").rollup("count").by("@conditions").last("1m") > 1',
  message:
    "@webhook-Events_Dev\nchain_xdai\nhost_2a\ncontainer_dai1\nbackend_daimainnet\nevent_{{@conditions.name}}",
  tags: ["template"],
  options: {
    thresholds: {
      critical: 1,
      warning: null,
      comparison: ">",
      period: {
        name: "1 minute average",
        value: "last_1m",
        text: "1 minute",
        no_data_timeframe: 2,
        seconds: 60,
        digit: 1,
        unit: "minutes",
        tense: "last",
      },
      timeAggregator: "avg",
    },

    enable_logs_sample: true,
    notify_audit: false,
    aggregation: {
      metric: "count",
      type: "count",
      groupBy: ["log_conditions"],
    },
    restriction_query: null,
    locked: true,
    renotify_interval: 10,
    include_tags: true,
    silenced: {},
    notify_no_data: false,
    groupby_simple_monitor: false,
    escalation_message:
      "@webhook-Events_Dev\nchain_xdai\nhost_2a\ncontainer_dai1\nbackend_daimainnet\nevent_{{@conditions.name}}_NOT_RESOLVED",
    new_group_delay: 60,
  },
  priority: null,
};
