import express from "express";
import { config } from "dotenv";

import { Reboot, HAProxy } from "../services";

config();

const reboot = new Reboot();
const lb = new HAProxy();
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/ping", (req, res) => {
  return res.json({ status: "ok" });
});

app.post("/webhook/docker/reboot", async ({ body }, res) => {
  const { name, type, compose, nginx, poktType } = body;
  try {
    const status = await reboot.rebootDockerContainerFromAgent({
      name,
      type,
      compose,
      nginx,
      poktType,
    });
    return res.json({ reboot: status });
  } catch (error) {
    throw new Error(error);
  }
});

app.post("/webhook/service/restart", async ({ body }, res) => {
  const { service } = body;
  try {
    const restart = await reboot.restartService(service);
    return res.json({ restart });
  } catch (error) {
    throw new Error(error);
  }
});

app.post("/webhook/lb/disable", async ({ body }, res) => {
  const { backend, server } = body;
  try {
    const status = await lb.disableServer({ backend, server });
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/webhook/lb/enable", async ({ body }, res) => {
  const { backend, server } = body;
  try {
    const status = await lb.enableServer({ backend, server });
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/webhook/lb/status", async ({ body }, res) => {
  const { backend, server } = body;
  try {
    const status = await lb.getServerStatus({ backend, server });
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/webhook/lb/count", async ({ body }, res) => {
  const { backend } = body;
  try {
    const status = await lb.getServerCount(backend);
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});
