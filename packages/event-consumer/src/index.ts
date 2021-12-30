import Redis from "ioredis";
import { Event } from "@pokt-foundation/node-monitoring-core/dist/services";
const { Redis: Consumer } = Event;

const redis = new Redis();
const triggered = new Consumer.Triggered();
const reTriggered = new Consumer.ReTriggered();
const resolved = new Consumer.Resolved();

const main = () => {
  redis.subscribe("send-error-event", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.subscribe("send-error-event-retrigger", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.subscribe("send-resolved-event", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.on("message", (channel, message) => {
    return {
      "send-error-event": triggered.processEvent,
      "send-error-event-retrigger": reTriggered.processEvent,
      "send-resolved-event": resolved.processEvent,
    }[channel](message);
  });
};

main();
