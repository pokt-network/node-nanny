import { Alert, DataDog } from "..";
import { AlertTypes } from "../../types";

const colors = {
  ERROR: 15548997,
  SUCCESS: 3066993,
};

export class Service {
  private alert: Alert;
  private dd: DataDog;
  constructor() {
    this.alert = new Alert();
    this.dd = new DataDog();
  }

  parseEvent({ msg, type, title, link, tags, status }) {
    const lines = msg.split("\n");
    const metric = lines[7];
    const monitorStatus = lines.splice(-1).join("");
    return {
      tags: tags.split(",").reduce((acc, curr) => {
        if (curr.includes(":")) {
          const [key, value] = curr.split(":");
          acc[key] = value;
        } else {
          acc[curr] = 1;
        }
        return acc;
      }, {}),
      status,
      metric,
      monitorStatus,
      title,
      link,
      type: type.toUpperCase(),
    };
  }

  async processEvent(event) {
    const { title, monitorStatus, link, type, metric, tags } = this.parseEvent(event);
    let fields = [
      {
        name: "Monitor Status",
        value: monitorStatus,
      },
      {
        name: "Link",
        value: link,
      },
    ];
    if (type === "ERROR") {
      fields.unshift({
        name: "Metrics",
        value: metric,
      });
    }

    if (tags.hasOwnProperty("latency")) {
      const { blockchainid, servicedomain, region } = tags;
      const logs = await this.dd.getLogs({
        query: `@blockchainID:${blockchainid} @serviceDomain:${servicedomain} @elapsedTime:>6 region:${region}`,
        from: "now-10m",
      });
      const formated = logs.map(({ message, timestamp }) => {
        return {
          name: timestamp.toString(),
          value: JSON.stringify(message, null, 2),
        };
      });
      formated.length = 5
      fields = fields.concat(formated);
    }

    if (tags.hasOwnProperty("error")) {
      const { blockchainid, servicedomain, region } = tags;
      const logs = await this.dd.getLogs({
        query: `@blockchainID:${blockchainid} @serviceDomain:${servicedomain} @status:error region:${region}`,
        from: "now-10m",
      });
      const formated = logs.map(({ message, timestamp }) => {
        return {
          name: timestamp.toString(),
          value: JSON.stringify(message, null, 2),
        };
      });

      formated.length = 5
      fields = fields.concat(formated);
    }

    return await this.alert.sendDiscordMessage({
      fields,
      title,
      color: colors[type],
      channel:
        process.env.MONITOR_TEST === "1"
          ? AlertTypes.Webhooks.WEBHOOK_ERRORS_TEST
          : AlertTypes.Webhooks.DATADOG_ALERTS,
    });
  }
}
