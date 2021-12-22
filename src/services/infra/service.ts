import { Alert, DataDog } from "..";
import { AlertTypes } from "../../types";

const colors = {
  ERROR: 15548997,
  SUCCESS: 3066993,
};

const webhooks = {
  TEST:
    "https://discord.com/api/webhooks/895805822569943060/EBN7fVY1KU2Xunl66hk0awg33Y1ajZpQC6EkMMH1L66tGwOMJ2t1czfygTabbTJmM-QB",
  GENERAL:
    "https://discord.com/api/webhooks/912802442201141299/BUtDZp0zYY5ObjtylJ23k0bEEqUfkR0O7rbJIPAXuyLH8Fee7-OmqwD1MT-MSGStWfas",
  APM:
    "https://discord.com/api/webhooks/923319480451481691/DpOKGPnpixGuw21FLwnqtBy6jvXsR-neQuJ-OmDY1KGYvksGk3buvSn3nFPBDxA9_YLS",
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

  //todo: break this function up into general and apm handling
  async processEvent({ event, channel }) {
    const { title, monitorStatus, link, type, metric, tags } = this.parseEvent(event);
    if (channel === "APM") {
      return await this.alert.sendDiscordMessage({
        fields: [
          {
            name: "Link",
            value: link,
          },
          {
            name: "Monitor Status",
            value: monitorStatus,
          },
        ],
        title,
        color: colors[type],
        channel: webhooks[channel],
      });
    }

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

    if (type === "ERROR" && tags.hasOwnProperty("latency")) {
      const { blockchainid, servicedomain, region } = tags;
      const logs = await this.dd.getLogs({
        query: `@blockchainID:${blockchainid} @serviceDomain:${servicedomain} @elapsedTime:>6 region:${region}`,
        from: "now-30m",
      });
      const formated = logs.map(({ message, timestamp }) => {
        return {
          name: timestamp.toString(),
          value: JSON.stringify(
            {
              error: message.error,
              elapsedTime: message.elapsedTime,
              serviceNode: message.serviceNode,
              origin: message.origin,
            },
            null,
            2,
          ),
        };
      });

      formated.length = 5;
      fields = fields.concat(formated);
    }

    if (type === "ERROR" && tags.hasOwnProperty("error")) {
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

      formated.length = 5;
      fields = fields.concat(formated);
    }

    try {
      return await this.alert.sendDiscordMessage({
        fields: [],
        title,
        color: colors[type],
        channel: webhooks[channel],
      });
    } catch (error) {
      console.log(error);
    }
  }
}
