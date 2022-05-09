import Redis from 'ioredis';
import { INode } from '@pokt-foundation/node-nanny-core/dist/models';
import { EventTypes, HealthTypes } from '@pokt-foundation/node-nanny-core/dist/types';

import env from '@pokt-foundation/node-nanny-core/dist/environment';

interface IMonitorEvent {
  message: HealthTypes.IHealthResponse;
  id: string;
}

export class Publish {
  private threshold: number;
  private redis: Redis.Redis;
  private retriggerThreshold: number;
  private map: Map<string, number>;

  constructor(nodes: INode[]) {
    this.redis = new Redis({ host: env('REDIS_HOST') });
    this.threshold = env('ALERT_TRIGGER_THRESHOLD');
    this.retriggerThreshold = env('ALERT_RETRIGGER_THRESHOLD');
    this.map = this.initPublish(nodes);
  }

  private initPublish(nodes: INode[]): Map<string, number> {
    const map = new Map<string, number>();
    nodes.forEach(({ id, status: prevStatus }) => {
      if (prevStatus !== HealthTypes.EErrorStatus.OK) {
        map.set(id.toString(), this.threshold);
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
        await this.redis.publish('send-event-trigger', JSON.stringify(event));
      }

      if (count !== 0 && count % this.retriggerThreshold === 0) {
        await this.redis.publish('send-event-retrigger', JSON.stringify(event));
      }
    }

    if (message.status === HealthTypes.EErrorStatus.OK) {
      /* If Node is healthy, check if it has recovered from previous errors */
      if (this.map.has(id)) {
        const count = this.map.get(id);
        this.map.delete(id);

        if (count >= this.threshold) {
          const event: EventTypes.IRedisEvent = { ...message, id, count };
          await this.redis.publish('send-event-resolved', JSON.stringify(event));
        }
      }
    }
  }
}
