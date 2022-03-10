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
    this.redis = new Redis();
    this.threshold = 6;
    this.retriggerThreshold = 20;
  }

  async evaluate({ message, id }: IMonitorEvent) {
    if (
      message.status === HealthTypes.EErrorStatus.ERROR ||
      message.status === HealthTypes.EErrorStatus.WARNING
    ) {
      /* Save number of times this node has errored */
      this.map.has(id)
        ? this.map.set(id, Number(this.map.get(id) + 1))
        : this.map.set(id, 1);
      const count = this.map.get(id);

      const event: EventTypes.IRedisEvent = { ...message, id, count };
      if (count >= this.threshold && count < this.retriggerThreshold) {
        await this.redis.publish("send-event-trigger", JSON.stringify(event));
      }

      if (count >= this.retriggerThreshold) {
        await this.redis.publish("send-event-retrigger", JSON.stringify(event));
      }
    }

    if (message.status === HealthTypes.EErrorStatus.OK) {
      /* If Node is healthy, check if it has recovered from previous errors */
      if (this.map.has(id)) {
        const count = this.map.get(id);
        this.map.delete(id);

        const event: EventTypes.IRedisEvent = { ...message, id, count };
        await this.redis.publish("send-event-resolved", JSON.stringify(event));
      }
    }
  }
}
