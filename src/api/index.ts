import express from "express";
import { config } from "dotenv";
import { Event, DataDog, Log } from "../services";
import { connect } from "../db";

config();
const event = new Event();
const dd = new DataDog();
const log = new Log();
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

const start = async () => {
  await connect();
  console.log("db connected");
  return app.listen(port, () => {
    console.log(`Webhook api listening at http://localhost:${port}`);
  });
};

start();
