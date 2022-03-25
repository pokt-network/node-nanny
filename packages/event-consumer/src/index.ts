import Redis from "ioredis";
import { Event as EventConsumer } from "@pokt-foundation/node-monitoring-core/dist/services";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";

const consumer = new EventConsumer();
const redis = new Redis({
  port: 6379,
  host: process.env.DOCKER === "true" ? "nn_redis" : "localhost",
});

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
    console.debug("EVENT CONSUMER RECEIVED", { message });
    return {
      "send-event-trigger": consumer.processTriggered,
      "send-event-retrigger": consumer.processRetriggered,
      "send-event-resolved": consumer.processResolved,
    }[channel](message);
  });
};

main();
