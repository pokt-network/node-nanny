import { App } from "./app";
import "./tracer";
const app = new App();
const run = async () => {
  await app.main();
};

run();
