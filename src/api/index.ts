import express from "express";
import { config } from "dotenv";
import { Event } from "../services";

config();
const event = new Event();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/datadog/monitor/events", async ({ body }, res) => {
  console.log(body)
  try {
    await event.processEvent(body);
    return res.status(200).json({ done: true });
  } catch (error) {
    res.sendStatus(500)
  }
});

app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});
