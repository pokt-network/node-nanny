import express from "express";
import { Reboot, HAProxy } from "../services";

const reboot = new Reboot();
const lb = new HAProxy();
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/docker/reboot", async ({ body }, res) => {
  const { name } = body;
  try {
    await reboot.rebootDockerContainerFromAgent(name);
    return res.json({ done: true });
  } catch (error) {
    throw new Error(error);
  }
});

app.post("/webhook/lb/disable", async ({ body }, res) => {
  const { backend, host, chain } = body;
  try {
   const response = await lb.disableServer({ backend, host, chain });
    console.log(response)
    return res.json({ done: true });
  } catch (error) {
    return res.status(500).send(error)
  }
});

app.post("/webhook/lb/enable", async ({ body }, res) => {
  const { backend, host } = body;
  try {
    await lb.enableServer({ backend, host });
    return res.json({ done: true });
  } catch (error) {
    throw new Error(error);
  }
});

app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});
