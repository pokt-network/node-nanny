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
    const nodes = await NodesModel.find().populate("host").populate("chain").exec();
    console.log(nodes)
    for (const node of nodes) {
      node.id = node._id;
      setInterval(async () => {
        const healthResponse = await this.health.getNodeHealth(node);
        let status;
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
        return await this.log.write({
          id: node.id,
          name: healthResponse.name,
          message: JSON.stringify(healthResponse),
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
