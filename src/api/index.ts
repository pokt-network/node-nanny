import express from "express";
import { Alert } from "../services";

const alert = new Alert();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/datadog/monitor/events", async ({ body }, res) => {
  return res.status(200).json({ done: true });
});

app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});
