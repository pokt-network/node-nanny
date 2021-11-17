import express from "express";
import { config } from "dotenv";
import { Event, DataDog, Retool } from "../services";
import { connect } from "../db";

config();
const event = new Event();
const dd = new DataDog();
const retool = new Retool();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.get("/retool/monitor/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.getMonitorStatus(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/retool/monitor/mute/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.getMuteStatus(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/retool/monitor/mute/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.muteMonitor(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/retool/monitor/unmute/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.unmuteMonitor(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/retool/lb/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.getHaProxyStatus(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/retool/lb/enable/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.addToRotation(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/retool/lb/disable/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.removeFromRotation(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/retool/reboot/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const status = await retool.rebootServer(id);
    return res.status(200).json({ status });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/queue/test", async (req, res) => {
  console.log(req.body);
  return res.status(200).json({ response: req.body });
});

const start = async () => {
  await connect();
  console.log("db connected");
  return app.listen(port, () => {
    console.log(`Webhook api listening at http://localhost:${port}`);
  });
};

start();
