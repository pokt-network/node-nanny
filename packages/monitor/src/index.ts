import { Health, Log } from "@pokt-foundation/node-monitoring-core/dist/services";
import { NodesModel } from "@pokt-foundation/node-monitoring-core/dist/models";
import { HealthTypes } from "@pokt-foundation/node-monitoring-core/dist/types";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import { Publish } from "./publish";
import "./tracer";

type Config = {
  logger: LoggerOptions;
  event: EventOptions;
};

enum LoggerOptions {
  MONGODB = "mongodb",
  DATADOG = "datadog",
}
enum EventOptions {
  REDIS = "redis",
  DATADOG = "datadog",
}

export class App {
  private log: Log;
  private health: Health;
  private config: Config;
  private publish: Publish;
  constructor(config) {
    this.config = config;
    this.health = new Health();
    this.log = new Log(config);
    this.publish = this.initPublish();
  }

  initPublish() {
    return this.config.event === "redis" ? new Publish() : null;
  }

  async main() {
    await connect();
    const nodes = await NodesModel.find({}).exec();
    for (const node of nodes) {
      setInterval(async () => {
        node.id = node._id;
        const { logGroup } = node;
        const healthResponse = await this.health.getNodeHealth(node);
        let status;
        if (healthResponse) {
          status = healthResponse.status;
        }
        let message = JSON.stringify(healthResponse);
        console.info({ message, logGroup });
        if (this.config.event === "redis") {
          await this.publish.evaluate({ message, id: node.id });
        }
        return await this.log.write({
          id: node.id,
          name: logGroup,
          message,
          level: status === HealthTypes.ErrorStatus.ERROR ? "error" : "info",
        });
      }, 10000);
    }
  }
}

new App({
  logger: process.env.MONITOR_LOGGER,
  event: process.env.MONITOR_EVENT,
}).main();
