import { v1 } from "@datadog/datadog-api-client";
import * as fs from "fs";

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
  private client: v1.MonitorsApi;
  constructor() {
    this.client = this.init();
  }

  private init(): v1.MonitorsApi {
    const configuration = v1.createConfiguration();
    return new v1.MonitorsApi(configuration);
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
        message: "@webhook-Discord",
      },
    };

    return await this.client.createMonitor(params);
  }

  async getAllMonitors() {
    return this.client.listMonitors();
  }
  async deleteMonitor({ monitorId }) {
    console.log(monitorId);
    return this.client.deleteMonitor({ monitorId });
  }

  async clearAllMonitors() {
    const list = await this.getAllMonitors();
    const ids = list.map(({ id }) => id);
    return await Promise.all(ids.map(async (monitorId) => await this.deleteMonitor({ monitorId })));
  }

  async createMonitors(list: LogGroupList[]): Promise<boolean> {
    for (const { name, logGroup } of list) {
      const monitor = await this.createMonitor({ name, logGroup });
      console.log(monitor)
    }
    return true;
  }
}
