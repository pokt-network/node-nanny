import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";
import { NodesModel } from "@pokt-foundation/node-nanny-core/dist/models";
import { Health, Log } from "@pokt-foundation/node-nanny-core/dist/services";
import { HealthTypes } from "@pokt-foundation/node-nanny-core/dist/types";
import { colorLog, s } from "@pokt-foundation/node-nanny-core/dist/utils";

import { Publish } from "./publish";

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

    const mode = process.env.MONITOR_TEST === "1" ? "TEST" : "PRODUCTION";
    const secs = this.interval / 1000;
    console.log(`Starting monitor in ${mode} mode with ${secs} sec interval ...`);

    /* ----- Update Node status fields on Monitor Start/Restart ----- */
    colorLog(`Updating status for ${nodes.length} node${s(nodes.length)} ...`, "blue");
    let updated = 0;
    for await (const node of nodes) {
      const { status, conditions } = await this.health.getNodeHealth(node);
      await NodesModel.updateOne({ _id: node.id }, { status, conditions });
      updated++;
      if (updated % 5 === 0) {
        console.log(`Updated ${updated} of ${nodes.length} nodes ...`);
      }
    }
    colorLog("Status update complete!\n Starting node monitoring interval ...", "green");

    /* ----- Start Node Monitoring Interval ----- */
    console.log(`📺 Monitor running. Monitoring ${nodes.length} node${s(nodes.length)}`);
    for await (const node of nodes) {
      const { id, host, name } = node;
      const ddLogGroupName = `${host.name}/${name}`;
      const logger = this.log.init(id, ddLogGroupName);

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
