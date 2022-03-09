import { config } from "dotenv";
import { Health, Log } from "@pokt-foundation/node-monitoring-core/dist/services";
import { NodesModel } from "@pokt-foundation/node-monitoring-core/dist/models";
import { HealthTypes } from "@pokt-foundation/node-monitoring-core/dist/types";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import { Publish } from "./publish";

import { wait } from "@pokt-foundation/node-monitoring-core/dist/utils";

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
const interval = 5000;

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

    // /* Actual Call */
    // const nodes = await NodesModel.find({ muted: false })
    //   .populate("host")
    //   .populate("chain")
    //   .exec();

    // /* TEST */
    const chains = [
      "TMT", // OK
      "POKT",
      "AVA",
      "SOL",
      "ALG",
      "HMY",
      "HEI",
      "EVM",
    ];
    const nodesResponse = (
      await NodesModel.find({ muted: false }).populate("host").populate("chain").exec()
    ).filter(({ chain }) => chain.type === "TMT");
    // const nodes = nodesResponse;
    const nodes = [nodesResponse[0]];
    // /* TEST */

    console.log(`📺 Monitor Running.\nCurrently monitoring ${nodes.length} nodes...`);

    for await (const node of nodes) {
      node.id = node._id;
      const logger = this.log.init(node.id);

      // /* TEST  */
      let TESTALERT = 1;
      // /* TEST  */
      setInterval(async () => {
        const healthResponse = await this.health.getNodeHealth(node);

        let status: HealthTypes.EErrorStatus;
        if (healthResponse) {
          status = healthResponse.status;
        }
        if (healthResponse.status == HealthTypes.EErrorStatus.OK) {
          console.log("\x1b[32m%s\x1b[0m", JSON.stringify(healthResponse));
        }
        if (healthResponse.status == HealthTypes.EErrorStatus.ERROR) {
          console.log("\x1b[31m%s\x1b[0m", JSON.stringify(healthResponse));
        }

        if (this.config.event === EventOptions.REDIS) {
          // /* TEST  */
          if (TESTALERT < 7) {
            healthResponse.status = HealthTypes.EErrorStatus.ERROR;
            healthResponse.conditions = HealthTypes.EErrorConditions.NOT_SYNCHRONIZED;
            healthResponse.health.result = "JUST A TEST NOTHING TO WORRY ABOUT";
            TESTALERT++;
          } else if (TESTALERT === 7) {
            healthResponse.conditions = HealthTypes.EErrorConditions.NOT_SYNCHRONIZED;
            TESTALERT++;
          }
          // /* TEST  */
          await this.publish.evaluate({ message: healthResponse, id: node.id });
        }

        this.log.write({
          message: JSON.stringify(healthResponse),
          level: status === HealthTypes.EErrorStatus.ERROR ? "error" : "info",
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
