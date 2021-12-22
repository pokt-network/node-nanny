import { Health, Log } from "./services";
import { NodesModel } from "./models";
import { connect } from "./db";
import { HealthTypes } from "./types";
import "./tracer";

export class App {
  private log: Log;
  private health: Health;
  constructor() {
    this.health = new Health();
    this.log = new Log();
  }

  async main() {
    await connect();
    const nodes = await NodesModel.find({
      logGroup: { $ne: null },
    }).exec();
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
        return await this.log.write({
          name: logGroup,
          message,
          level: status === HealthTypes.ErrorStatus.ERROR ? "error" : "info",
        });
      }, 20000);
    }
  }
}

new App().main();
