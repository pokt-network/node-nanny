import { App } from "./app";
import StatsD from "hot-shots";
import "./tracer";

enum Config {
  INTERVAL = 10000,
}

const app = new App();
const statsd = new StatsD({
  globalTags: { env: process.env.NODE_ENV },
});

setInterval(async () => {
  const response = app.main();
  console.log(response);
  statsd.increment("process.interval");
}, Config.INTERVAL);
