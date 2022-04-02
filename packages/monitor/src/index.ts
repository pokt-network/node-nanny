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
      const { id, host, name } = node;
      const ddLogGroupName = `${host.name}/${name}`;
      const logger = this.log.init(id, ddLogGroupName);

      /* Update Node status fields  on Monitor Start/Restart */
      const { status, conditions } = await this.health.getNodeHealth(node);
      await NodesModel.updateOne({ _id: id }, { status, conditions });

      /* ----- Starts Node Monitoring Interval ----- */
      setInterval(async () => {
        /* Get Node health */
        const healthResponse = await this.health.getNodeHealth(node);
        const status: HealthTypes.EErrorStatus = healthResponse?.status;

        /* Log to process console */
        if (status === HealthTypes.EErrorStatus.OK) {
          colorLog(JSON.stringify(healthResponse), "green");
        }
        if (status === HealthTypes.EErrorStatus.ERROR) {
          colorLog(JSON.stringify(healthResponse), "red");
        }

        /* Publish event to Redis */
        await this.publish.evaluate({ message: healthResponse, id });

        /* Log to MongoDB or Datadog */
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
