import Redis from "ioredis";
import { Health, Log } from "@pokt-foundation/node-monitoring-core/services";
import { NodesModel } from "@pokt-foundation/node-monitoring-core/models";
import { connect } from "@pokt-foundation/node-monitoring-core/db";
import { HealthTypes } from "@pokt-foundation/node-monitoring-core/types";
import "./tracer";

export class App {
  private log: Log;
  private health: Health;
  private redis: Redis;
  private threshold: number;
  private map: Map<any, any>;
  constructor() {
    this.health = new Health();
    this.log = new Log();
    this.redis = new Redis();
    this.threshold = 2;
    this.map = new Map();
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
            const exists = this.map.has(node.id);
            if (!exists) {
              this.map.set(node.id, 1);
            } else {
              this.map.set(node.id, Number(this.map.get(node.id) + 1));
            }
            const count = this.map.get(node.id);
            if (count >= this.threshold) {
              await this.redis.publish(
                "send-error-event",
                JSON.stringify({ ...message, id: node.id, count }),
              );
            }
          }
          if (message.status === HealthTypes.ErrorStatus.OK) {
            if (this.map.has(node.id)) {
              this.map.delete(node.id);
              await this.redis.publish(
                "send-resolved-event",
                JSON.stringify({ ...message, id: node.id }),
              );
            }
          }
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
