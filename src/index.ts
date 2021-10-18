import StatsD from "hot-shots";
import { App } from "./app";
import "./tracer";

const app = new App();
const statsd = new StatsD({
  globalTags: { env: process.env.NODE_ENV },
});

const run = async () => {
  await app.main();
  statsd.increment("process.interval");
  await run();
};

run();
