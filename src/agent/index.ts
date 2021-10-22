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

app.post("/webhook/docker/reboot", async ({ body }, res) => {
  const { name, type, compose, nginx, poktType } = body;
  try {
    const status = await reboot.rebootDockerContainerFromAgent({ name, type, compose, nginx, poktType });
    return res.json({ reboot: status });
  } catch (error) {
    throw new Error(error);
  }
});

app.post("/webhook/lb/disable", async ({ body }, res) => {
  const { backend, host } = body;

  console.log({ backend, host })
  try {
    const status = await lb.disableServer({ backend, host });
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/webhook/lb/enable", async ({ body }, res) => {
  const { backend, host } = body;
  try {
    const status = await lb.enableServer({ backend, host });
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});


app.post("/webhook/lb/status", async ({ body }, res) => {
  const { backend } = body;

  console.log(body)
  try {
    const status = await lb.getStatus(backend)
    return res.json({ status });
  } catch (error) {
    return res.status(500).send(error);
  }
});


app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});
