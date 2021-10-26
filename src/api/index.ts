import express from "express";
import { config } from "dotenv";
import { Event, DataDog, Log, Retool } from "../services";
import { connect } from "../db";

config();
const event = new Event();
const dd = new DataDog();
const log = new Log();
const retool = new Retool();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/datadog/monitor/events", async ({ body }, res) => {
  try {
    await event.processEvent(body);
    return res.status(200).json({ done: true });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/admin/monitor/onboard", async ({ body }, res) => {
  const { name, id } = body;
  try {
    const logGroup = await log.onBoardNewNode(name);
    await dd.createMonitor({ name, logGroup, id });
    return res.status(200).json({ done: true });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/retool/monitor/status/:id", async (req, res) => {
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

const start = async () => {
  await connect();
  console.log("db connected");
  return app.listen(port, () => {
    console.log(`Webhook api listening at http://localhost:${port}`);
  });
};

start();
