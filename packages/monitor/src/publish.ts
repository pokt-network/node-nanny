import Redis from "ioredis";
import { INode } from "@pokt-foundation/node-nanny-core/dist/models";
import { EventTypes, HealthTypes } from "@pokt-foundation/node-nanny-core/dist/types";

interface IMonitorEvent {
  message: HealthTypes.IHealthResponse;
  id: string;
}
export class Publish {
  private map: Map<string, number>;
  private threshold: number;
  private redis: Redis.Redis;
  private retriggerThreshold: number;

  constructor(nodes: INode[]) {
    this.map = this.initPublish(nodes);
    this.redis = new Redis({ host: process.env.REDIS_HOST });
    this.threshold = Number(process.env.ALERT_TRIGGER_THRESHOLD || 6);
    this.retriggerThreshold = Number(process.env.ALERT_RETRIGGER_THRESHOLD || 20);
  }

  private initPublish(nodes: INode[]): Map<string, number> {
    const map = new Map<string, number>();
    nodes.forEach(({ id, status: prevStatus }) => {
      if (prevStatus === HealthTypes.EErrorStatus.ERROR) {
        map.set(id.toString(), 1);
      }
    });
    return map;
  }

  async evaluate({ message, id }: IMonitorEvent) {
    if (message.status === HealthTypes.EErrorStatus.ERROR) {
      /* Save number of times this node has errored */
      this.map.has(id)
        ? this.map.set(id, Number(this.map.get(id) + 1))
        : this.map.set(id, 1);
      const count = this.map.get(id);

      const event: EventTypes.IRedisEvent = { ...message, id, count };
      if (count === this.threshold) {
        await this.redis.publish("send-event-trigger", JSON.stringify(event));
      }

      if (count !== 0 && count % this.retriggerThreshold === 0) {
        await this.redis.publish("send-event-retrigger", JSON.stringify(event));
      }
    }

    if (message.status === HealthTypes.EErrorStatus.OK) {
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
