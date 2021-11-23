import { Alert } from "..";
import { AlertTypes } from "../../types";

const colors = {
  ERROR: 15548997,
  SUCCESS: 3066993,
};

export class Service {
  private alert: Alert;
  constructor() {
    this.alert = new Alert();
  }

  parseEvent({ msg, type, title, link }) {
    const lines = msg.split("\n");
    const metric = lines[7];
    const status = lines.splice(-1).join("");
    return {
      metric,
      status,
      title,
      link,
      type: type.toUpperCase(),
    };
  }

  async processEvent(event) {
    const { title, status, link, type, metric } = this.parseEvent(event);
    const fields = [
      {
        name: "Status",
        value: status,
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
