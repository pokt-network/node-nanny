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

/*
setInterval(async () => {
  await app.main();
  statsd.increment("process.interval");
}, Config.INTERVAL);
*/

app.main().then(console.log);
