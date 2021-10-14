import axios, { AxiosInstance } from "axios";
import { v1, v2 } from "@datadog/datadog-api-client";
import { NodesModel } from '../../models';
import { ApiDetails } from "./types";
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
          from: "now-3m",
          query: `host:${instance} container_name:${container}`,
          to: "now",
        },
        options: {
          //  timeOffset: -8,
        },
        sort: "-timestamp",
      },
    };

    try {
      return await (await this.ddlogs.listLogs(params)).data.map(({ attributes }) => {
        const { timestamp, service, message } = attributes
        return { timestamp, service, message }
      })
    } catch (error) { throw new Error(error) }

  }

  async getHealthLogs({ host, logGroup }) {
    let params: v2.LogsApiListLogsRequest = {
      body: {
        filter: {
          from: "now-3m",
          query: `service:"${logGroup}"`,
          to: "now",
        },
        options: {
          timeOffset: -8,
        },
        sort: "-timestamp",
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
    let [, , nodeId, event] = msg.split("\n");
    event = event.split("event_")[1];
    nodeId = nodeId.split("nodeId_")[1];
    return { event, id, nodeId, transition, type, title, link };
  }

  async storeMonitorIds() {
    const monitors = await this.getMonitorsByTag("Smart_MonitorV2");

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

  async createMonitor({ name, logGroup, id }) {
    const { data } = await this.restClient.post('/monitor', {
      "name": name.toUpperCase(),
      "type": "log alert",
      "query": `logs(\"status:error source:\\\"${logGroup.toLowerCase()}\\\"\").index(\"*\").rollup(\"count\").by(\"@conditions\").last(\"5m\") > 4`,
      "message": `@webhook-events-production \nnodeId_${id}\nevent_{{@conditions.name}}"`,
      "tags": [
        "Smart_Monitorv2"
      ],
      "options": {
        "notify_audit": false,
        "locked": false,
        "renotify_interval": 10,
        "include_tags": true,
        "thresholds": {
          "critical": 4
        },
        "silenced": {},
        "notify_no_data": false,
        "enable_logs_sample": true,
        "groupby_simple_monitor": false,
        "escalation_message": `@webhook-events-production \nnodeId_${id}\nevent_{{@conditions.name}}_NOT_RESOLVED`,
        "new_group_delay": 60
      },
      "classification": "log"


    })
    const { id: monitorId } = data;
    await NodesModel.findOneAndUpdate({ _id: id }, { $set: { monitorId } })
    return monitorId;
  }

  async getAllMonitorsByTag(tag) {
    return await this.restClient.get(`/monitor?monitor_tags=${tag}`)
  }


  async updateMonitor({ id, update }) {
    return await this.restClient.put(`/monitor/${id}`, update)
  }

  async changeWebhookForMonitors() {

    const { data: monitors } = await this.getAllMonitorsByTag('Smart_Monitorv2')

    for (const monitor of monitors) {

      const id = monitor.id
      const message = String(monitor.options.escalation_message).replace('@webhook-events-production', '@webhook-events-dev')

      const response = await this.updateMonitor({ id, update: { options: { escalation_message: message } } })

      console.log(response)
    }




    return {}
  }

}
