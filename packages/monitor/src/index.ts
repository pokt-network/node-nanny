import { config } from "dotenv";
import { Health, Log } from "@pokt-foundation/node-monitoring-core/dist/services";
import { NodesModel } from "@pokt-foundation/node-monitoring-core/dist/models";
import { HealthTypes } from "@pokt-foundation/node-monitoring-core/dist/types";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import { Publish } from "./publish";

config();

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

// const interval = 30000;
const interval = 10000;

export class App {
  private log: Log;
  private health: Health;
  private config: Config;
  private publish: Publish;

  constructor(config: Config) {
    this.config = config;
    this.health = new Health();
    this.log = new Log();
    this.publish = this.initPublish();
  }

  initPublish() {
    return this.config.event === "redis" ? new Publish() : null;
  }

  async main() {
    await connect();

    const nodes = await NodesModel.find({ muted: false })
      .populate("host")
      .populate("chain")
      .exec();

    for await (const node of nodes) {
      node.id = node._id;
      const logger = this.log.init(node.id);

      setInterval(async () => {
        const healthResponse = await this.health.getNodeHealth(node);

        let status: HealthTypes.ErrorStatus;
        if (healthResponse) {
          status = healthResponse.status;
        }

        if (healthResponse.status == HealthTypes.ErrorStatus.OK) {
          console.log("\x1b[32m%s\x1b[0m", JSON.stringify(healthResponse));
        }
        if (healthResponse.status == HealthTypes.ErrorStatus.ERROR) {
          console.log("\x1b[31m%s\x1b[0m", JSON.stringify(healthResponse));
        }

        if (this.config.event === EventOptions.REDIS) {
          await this.publish.evaluate({ message: healthResponse, id: node.id });
        }

        this.log.write({
          message: JSON.stringify(healthResponse),
          level: status === HealthTypes.ErrorStatus.ERROR ? "error" : "info",
          logger,
        });
      }, interval);
    }
  }
}

new App({
  logger: process.env.MONITOR_LOGGER as LoggerOptions,
  event: process.env.MONITOR_EVENT as EventOptions,
}).main();
