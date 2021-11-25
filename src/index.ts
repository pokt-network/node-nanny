import Redis from "ioredis";
import { Health, Log } from "./services";
import { NodesModel } from "./models";
import { connect } from "./db";
import { HealthTypes } from "./types";
import "./tracer";

export class App {
  private log: Log;
  private health: Health;
  private redis: Redis;
  constructor() {
    this.health = new Health();
    this.log = new Log();
    this.redis = new Redis();
  }

  async main() {
    await connect();
    const nodes = await NodesModel.find({}).exec();
    for (const node of nodes) {
      setInterval(async () => {
        node.id = node._id;
        const message = await this.health.getNodeHealth(node);
        if (message && message.status) {
          if (message.status === HealthTypes.ErrorStatus.ERROR) {
            await this.redis.publish(
              "send-error-event",
              JSON.stringify({ ...message, id: node.id }),
            );
          }
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
