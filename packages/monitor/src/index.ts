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
  private interval: number;

  constructor(config: Config) {
    this.config = config;
    this.health = new Health();
    this.log = new Log();
    this.publish = this.initPublish();
    // this.interval = Number(process.env.MONITOR_INTERVAL) || 30000;
    this.interval = 10000;
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

    /* TEST */
    const chains = [
      "ALG", // NO_RESPONSE ERROR
      "AVA", // OK
      "EVM", // OK
      "HMY", // OK
      "POKT", // NO_RESPONSE (ALL BUT 3)
      "SOL", // NO_RESPONSE
      "TMT", // OK
    ];
    const nodesResponse = (
      await NodesModel.find({ muted: false }).populate("host").populate("chain").exec()
    ).filter(
      ({ chain, url }) =>
        // ({ chain, url }) => url === "http://10.0.2.15:8546",
        chain.type === "SOL",
    );
    const nodes = nodesResponse;
    // const nodes = [nodesResponse[0]];
    console.debug(`MONITOR TEST IS ${process.env.MONITOR_TEST === "1"}`);
    console.debug(`MONITOR TEST IS ${process.env.MONITOR_TEST === "1"}`);
    /* TEST */

    console.log(`📺 Monitor Running.\nCurrently monitoring ${nodes.length} nodes...`);

    for await (const node of nodes) {
      node.id = node._id;
      const logger = this.log.init(node.id);

      // /* TEST  */
      // let TESTALERT = 1;
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
          // /* TEST */
          // if (TESTALERT < 7) {
          //   healthResponse.status = HealthTypes.EErrorStatus.ERROR;
          //   healthResponse.conditions = HealthTypes.EErrorConditions.NOT_SYNCHRONIZED;
          //   TESTALERT++;
          // } else if (TESTALERT === 7) {
          //   healthResponse.conditions = HealthTypes.EErrorConditions.NOT_SYNCHRONIZED;
          //   TESTALERT++;
          // }
          // console.debug({ TESTALERT });
          // /* TEST */
          await this.publish.evaluate({ message: healthResponse, id: node.id });
        }

        this.log.write({
          message: JSON.stringify(healthResponse),
          level: status === HealthTypes.EErrorStatus.ERROR ? "error" : "info",
          logger,
        });
      }, this.interval);
    }
  }
}

new App({
  logger: process.env.MONITOR_LOGGER as LoggerOptions,
  event: process.env.MONITOR_EVENT as EventOptions,
}).main();
