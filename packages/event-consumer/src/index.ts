import Redis from "ioredis";
import { Event } from "@pokt-foundation/node-monitoring-core/dist/services";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
const { Redis: Consumer } = Event;

const consumer = new Consumer();
const redis = new Redis();

const main = async () => {
  await connect();
  redis.subscribe("send-event-trigger", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.subscribe("send-event-retrigger", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.subscribe("send-event-resolved", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.on("message", (channel, message) => {
    return {
      "send-event-trigger": consumer.processTriggered,
      "send-event-retrigger": consumer.processReTriggered,
      "send-event-resolved": consumer.processResolved,
    }[channel](message);
  });
};

main();
