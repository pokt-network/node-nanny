import { v1 } from "@datadog/datadog-api-client";
import axios, { AxiosInstance } from "axios";
import { config } from "dotenv";

config();

enum LogTypes {
  LOG = "log alert",
}

enum Thresholds {
  CRITICAL = 2.0,
  WARNING = 1.0,
}

interface LogGroupList {
  name: string;
  logGroup: string;
}

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
      baseURL: "https://api.datadoghq.eu/api/v1",
    });
  }
  async createMonitor({
    name,
    type = LogTypes.LOG,
    logGroup,
    critical = Thresholds.CRITICAL,
    warning = Thresholds.WARNING,
  }) {
    const params: v1.MonitorsApiCreateMonitorRequest = {
      body: {
        name,
        type,
        options: {
          thresholds: { critical, warning },
        },
        query: `logs("status:error source:\\"${logGroup}\\"").index("*").rollup("count").last("5m") > 2`,
        message: "@webhook-API-Production",
      },
    };

    return await this.sdkClient.createMonitor(params);
  }

  async getMonitor(id) {
    return await this.sdkClient.getMonitor({ monitorId: id });
  }
  async getAllMonitors() {
    return await this.sdkClient.listMonitors();
  }
  async deleteMonitor({ monitorId }) {
    console.log(monitorId);
    return await this.sdkClient.deleteMonitor({ monitorId });
  }

  async clearAllMonitors() {
    const list = await this.getAllMonitors();
    const ids = list.map(({ id }) => id);
    return await Promise.all(ids.map(async (monitorId) => await this.deleteMonitor({ monitorId })));
  }

  async createMonitors(list: LogGroupList[]): Promise<boolean> {
    for (const { name, logGroup } of list) {
      const monitor = await this.createMonitor({ name, logGroup });
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
        console.log(`already muted`);
        return -1;
      }
      const { data } = await this.restClient.post(`/monitor/${id}/mute?end=${ts}`);
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }
}
