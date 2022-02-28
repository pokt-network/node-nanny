import express from "express";
import { config } from "dotenv";
import {
  Event,
  DataDog,
  Automation,
  Infra,
} from "@pokt-foundation/node-monitoring-core/dist/services";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";

config();
const event = new Event.DataDog();
const dd = new DataDog();
const automation = new Automation();
const infra = new Infra();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/datadog/infra", async ({ body }, res) => {
  try {
    await infra.processEvent(body);
    return res.status(200).json({ done: true });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/webhook/datadog/monitor/events", async ({ body }, res) => {
  console.log(body);
  try {
    await event.processEvent(body);
    return res.status(200).json({ done: true });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/admin/monitor/onboard", async ({ body }, res) => {
  const { name, id, logGroup } = body;
  try {
    await dd.createMonitor({ name, logGroup, id });
    return res.status(200).json({ done: true });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/automation/monitor/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.getMonitorStatus(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/automation/host/add", async (req, res) => {
  const { awsInstanceId, loadBalancer } = req.body;
  try {
    const status = await automation.findAndStoreAWSHost({ awsInstanceId, loadBalancer });
    return res.status(201).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/automation/monitor/mute/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.getMuteStatus(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/automation/monitor/mute/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.muteMonitor(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/automation/monitor/unmute/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.unmuteMonitor(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/automation/lb/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.getHaProxyStatus(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/automation/lb/enable/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.addToRotation(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/automation/lb/disable/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.removeFromRotation(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/automation/reboot/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await automation.rebootServer(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

const start = async () => {
  await connect();
  console.log("MongoDB connected ...");
  return app.listen(port, () => {
    console.log(`Webhook api listening at http://localhost:${port}`);
  });
};

start();
