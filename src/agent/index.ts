import express from "express";
import { Service } from "../services/alert";

const alert = new Service();
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/datadog/monitor/reboot", async ({ body }, res) => {
  try {
    return res.json({ done: true });
  } catch (error) {
    throw new Error(error);
  }
});
app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});
