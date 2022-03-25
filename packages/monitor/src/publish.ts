import Redis from "ioredis";
import {
  EventTypes,
  HealthTypes,
} from "@pokt-foundation/node-monitoring-core/dist/types";

interface IMonitorEvent {
  message: HealthTypes.IHealthResponse;
  id: string;
}

export class Publish {
  private map: Map<string, number>;
  private threshold: number;
  private redis: Redis.Redis;
  private retriggerThreshold: number;

  constructor() {
    this.map = new Map<string, number>();
    this.redis = new Redis({
      port: 6379,
      host: process.env.DOCKER === "true" ? "nn_redis" : "localhost",
    });
    this.threshold = 6;
    this.retriggerThreshold = 20;
  }

  async evaluate({ message, id }: IMonitorEvent) {
    if (message.status === HealthTypes.EErrorStatus.ERROR) {
      /* Save number of times this node has errored */
      this.map.has(id)
        ? this.map.set(id, Number(this.map.get(id) + 1))
        : this.map.set(id, 1);
      const count = this.map.get(id);

      const event: EventTypes.IRedisEvent = { ...message, id, count };
      console.debug("ERROR IN MONITOR", { count, event });
      if (count >= this.threshold && count < this.retriggerThreshold) {
        await this.redis.publish("send-event-trigger", JSON.stringify(event));
      }

      if (count >= this.retriggerThreshold) {
        await this.redis.publish("send-event-retrigger", JSON.stringify(event));
      }
    }

    if (message.status === HealthTypes.EErrorStatus.OK) {
      console.debug("OK IN MONITOR", { count: this.map.has(id) });
      /* If Node is healthy, check if it has recovered from previous errors */
      if (this.map.has(id)) {
        const count = this.map.get(id);
        this.map.delete(id);

        if (count >= this.threshold) {
          const event: EventTypes.IRedisEvent = { ...message, id, count };
          await this.redis.publish("send-event-resolved", JSON.stringify(event));
        }
      }
    }
  }
}
