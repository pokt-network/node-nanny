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

    }).exec();
    for (const node of nodes) {
      setInterval(async () => {
        node.id = node._id;
        const message = await this.health.getNodeHealth(node);
        if (message && message.status) {
          console.log({ message });
          return await this.log.writeLogtoDB({
            message,
            nodeId: node._id,
          });
        }
      }, 10000);
    }
  }
}

new App().main();
