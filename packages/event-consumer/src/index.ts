import Redis from "ioredis";
import { Event as EventConsumer } from "@pokt-foundation/node-nanny-core/dist/services";
import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";

const consumer = new EventConsumer();
const redis = new Redis({ host: process.env.REDIS_HOST });

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

  redis.on("message", (channel: string, message: string) => {
    return {
      "send-event-trigger": consumer.processTriggered,
      "send-event-retrigger": consumer.processRetriggered,
      "send-event-resolved": consumer.processResolved,
    }[channel](message);
  });
};

process.on("SIGINT", function () {
  disconnect();
});

main();
