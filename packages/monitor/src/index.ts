import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";
import { createFrontendAlertChannel } from "@pokt-foundation/node-nanny-core/dist/jobs";
import { NodesModel } from "@pokt-foundation/node-nanny-core/dist/models";
import { Health, Log } from "@pokt-foundation/node-nanny-core/dist/services";
import { HealthTypes } from "@pokt-foundation/node-nanny-core/dist/types";
import { colorLog, s } from "@pokt-foundation/node-nanny-core/dist/utils";

import Env from "@pokt-foundation/node-nanny-core/dist/environment";

import { Publish } from "./publish";

export class App {
  private log: Log;
  private health: Health;
  private interval: number;

  constructor() {
    this.log = new Log();
    this.health = new Health();
    this.interval = Env("MONITOR_INTERVAL");
  }

  /** Runs a health check on all non-muted nodes in the inventory DB at a set interval.
   * Events are published to REDIS and logs written to MongoDB. */
  async main() {
    await connect();
    await createFrontendAlertChannel();

    const nodes = await NodesModel.find({ muted: false })
      .populate("host")
      .populate("chain")
      .exec();
    const publish = new Publish(nodes);

    const mode = Env("MONITOR_TEST") ? "TEST" : "PRODUCTION";
    const secs = this.interval / 1000;
    console.log(`Starting monitor in ${mode} mode with ${secs} sec interval ...`);

    /* ----- PNF Interval Dispatchers Report ----- */
    // if (Env("PNF") && nodes.some(({ dispatch }) => dispatch === true)) {
    //   setInterval(async () => {
    //     await publish.pnfDispatchersReport();
    //   }, 600000);
    // }

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
        await publish.evaluate({ message: healthResponse, id });

        /* Log to MongoDB or Datadog */
        const level = status === HealthTypes.EErrorStatus.ERROR ? "error" : "info";
        logger.log({ level, message: JSON.stringify(healthResponse) });
      }, this.interval);
    }
  }
}

process.on("SIGINT", async function () {
  await disconnect();
});

new App().main();
