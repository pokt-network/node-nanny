import { Health, Log } from "@pokt-foundation/node-monitoring-core/dist/services";
import { NodesModel } from "@pokt-foundation/node-monitoring-core/dist/models";
import { HealthTypes } from "@pokt-foundation/node-monitoring-core/dist/types";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import { config } from "dotenv";

import { Publish } from "./publish";

config();

const mode = process.env.MONITOR_TEST === "1" ? "TEST" : "PRODUCTION";

export class App {
  private log: Log;
  private health: Health;
  private publish: Publish;
  private interval: number;

  constructor() {
    this.health = new Health();
    this.log = new Log();
    this.publish = new Publish();
    this.interval = Number(process.env.MONITOR_INTERVAL || 30000);
  }

  /** Runs a health check on all non-muted nodes in the inventory DB at a set interval.
   * Events are published to REDIS and logs written to MongoDB. */
  async main() {
    await connect();

    const nodes = await NodesModel.find({ muted: false })
      .populate("host")
      .populate("chain")
      .exec();

    console.log(`Running in ${mode} mode with ${this.interval / 1000} sec interval.`);
    console.log(`📺 Currently monitoring ${nodes.length} nodes...`);

    for await (const node of nodes) {
      const logger = this.log.init(node.id);

      setInterval(async () => {
        /* Get Node health */
        const healthResponse = await this.health.getNodeHealth(node);
        const status: HealthTypes.EErrorStatus = healthResponse?.status;

        /* Log to process output */
        if (status === HealthTypes.EErrorStatus.OK) {
          console.log("\x1b[32m%s\x1b[0m", JSON.stringify(healthResponse));
        }
        if (status === HealthTypes.EErrorStatus.ERROR) {
          console.log("\x1b[31m%s\x1b[0m", JSON.stringify(healthResponse));
        }

        /* Publish event to REDIS */
        await this.publish.evaluate({ message: healthResponse, id: node.id });

        /* Log to MongoDB logs collection */
        const level = status === HealthTypes.EErrorStatus.ERROR ? "error" : "info";
        logger.log({ level, message: JSON.stringify(healthResponse) });
      }, this.interval);
    }
  }
}

new App().main();
