import { Service } from "./service";
import { AlertChannel, Titles } from "./types";

const alert = new Service();

test("stop docker container then start with compose", async () => {
const res =  await alert.rebootNode({name:"goe1"});
console.log(res)
  expect(3).toBe(3);
});

const errorMessage = {
  transition: "Triggered",
  type: "error",
  title: "[Triggered] bisontrails-2a",
  msg:
    "%%%\n" +
    "@webhook-API\n" +
    "\n" +
    "More than **2** log events matched in the last **5m** against the monitored query: **[*](https://app.datadoghq.eu/logs?query=%2A&agg_m=count&agg_t=count&index=)**\n" +
    "\n" +
    "The monitor was last triggered at Fri Aug 06 2021 20:23:31 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/1783231?to_ts=1628281411000&group=total&from_ts=1628280511000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1783231/edit)] · [[Related Logs](https://app.datadoghq.eu/logs?index=%2A&to_ts=1628281411000&agg_t=count&agg_m=count&from_ts=1628280511000&live=false&query=%2A)]",
};

const recoveredMessage = {
  transition: "Recovered",
  type: "success",
  title: "[Recovered] bisontrails-2a",
  msg:
    "%%%\n" +
    "@webhook-API\n" +
    "\n" +
    "The monitor was marked as **Recovered** on **total** by Jonathon Fritz.\n" +
    "\n" +
    "The monitor was last triggered at Fri Aug 06 2021 20:11:31 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/1783231?to_ts=1628280691000&group=total&from_ts=1628279791000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1783231/edit)] · [[Related Logs](https://app.datadoghq.eu/logs?index=%2A&to_ts=1628280691000&agg_t=count&agg_m=count&from_ts=1628279791000&live=false&query=%2A)]",
};
