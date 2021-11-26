import Redis from "ioredis";
const redis = new Redis();

const main = () => {
  redis.subscribe("send-error-event", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });
  
  redis.subscribe("send-resolved-event", (err, count) => {
    if (err) console.error(err.message);
    console.log(`Subscribed to ${count} channels.`);
  });

  redis.on("message", (channel, message) => {
    console.log(`Received message from ${channel} channel.`);
    console.log(JSON.parse(message));
  });
};

main();