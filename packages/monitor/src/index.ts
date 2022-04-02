import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";
import { NodesModel } from "@pokt-foundation/node-nanny-core/dist/models";
import { Health, Log } from "@pokt-foundation/node-nanny-core/dist/services";
import { HealthTypes } from "@pokt-foundation/node-nanny-core/dist/types";
import { colorLog } from "@pokt-foundation/node-nanny-core/dist/utils";

import { Publish } from "./publish";

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
      const { id, chain, host, server } = node;
      const name = `${host.name}/${chain.name}${server ? `/${server}` : ""}`;
      const logger = this.log.init(id, name);

      let count = 0;
      setInterval(async () => {
        /* Get Node health */
        const healthResponse = await this.health.getNodeHealth(node);
        const status: HealthTypes.EErrorStatus = healthResponse?.status;

        /* Log to process output */
        // if (status === HealthTypes.EErrorStatus.OK) {
        //   colorLog(JSON.stringify(healthResponse), "green");
        // }
        // if (status === HealthTypes.EErrorStatus.ERROR) {
        //   colorLog(JSON.stringify(healthResponse), "red");
        // }

        if (id === "6244d698d8877341d1c35312") {
          if (count <= 21) {
            healthResponse.status === HealthTypes.EErrorStatus.ERROR;
            healthResponse.conditions === HealthTypes.EErrorConditions.NOT_SYNCHRONIZED;
            await this.publish.evaluate({ message: healthResponse, id });
            count++;
          } else if (count === 22) {
            healthResponse.status === HealthTypes.EErrorStatus.OK;
            healthResponse.conditions === HealthTypes.EErrorConditions.NOT_SYNCHRONIZED;
            await this.publish.evaluate({ message: healthResponse, id });
            count++;
          } else {
            healthResponse.status === HealthTypes.EErrorStatus.OK;
            healthResponse.conditions === HealthTypes.EErrorConditions.HEALTHY;
            await this.publish.evaluate({ message: healthResponse, id });
            count = 0;
          }
        } else {
          /* Publish event to REDIS */
          await this.publish.evaluate({ message: healthResponse, id });
        }

        /* Log to MongoDB logs collection */
        const level = status === HealthTypes.EErrorStatus.ERROR ? "error" : "info";
        logger.log({ level, message: JSON.stringify(healthResponse) });
      }, this.interval);
    }
  }
}

process.on("SIGINT", function () {
  disconnect();
});

new App().main();
