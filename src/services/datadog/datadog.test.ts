import { config } from "dotenv";
import { Service } from "./service";
import { Status } from "./types";
const dd = new Service();

config();

test("should construct event object from dd string", async () => {
  const response = await dd.parseWebhookMessage(retrigger);
  expect(response).toHaveProperty("event");
  expect(response).toHaveProperty("host");
  expect(response).toHaveProperty("chain");
  expect(response).toHaveProperty("container");
  expect(response).toHaveProperty("id");
  expect(response).toHaveProperty("transition");
  expect(response).toHaveProperty("type");
  expect(response).toHaveProperty("title");
  expect(response).toHaveProperty("backend");
  expect(response).toHaveProperty("link");
});

test("should get status of dd monitor", async () => {
  const response = await dd.getMonitorStatus("1867792");
  expect(Object.values(Status)).toContain(response);
});

test("should store dd tags in ssm", async () => {
  //  await dd.storeMonitorIds()
})

test("should get logs from datadog", async () => {
  const logs = await dd.getLogs({ instance: "i-0fb709e897295a622", container: "goe1" })

})

const event = {
  msg:
    "%%%\n" +
    "@webhook-Events_Dev\n" +
    "chain_xdai\n" +
    "host_2a\n" +
    "container_dai1\n" +
    "backend_daimainnet\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    'More than **1** log events matched in the last **1m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/shared-2b/kov"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Thu Aug 26 2021 19:05:52 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/1867792?to_ts=1630004752000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1630003852000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1867792/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1630004752000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1630003852000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22)]",
  id: "1867792",
  transition: "Triggered",
  type: "error",
  title: "[P2] [Triggered on {@conditions:NOT_SYNCHRONIZED}] xDai UE2-A",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6136132146668244401",
};

const retrigger = {
  msg:
    "%%%\n" +
    "@webhook-Events_Dev\n" +
    "chain_xdai\n" +
    "host_2a\n" +
    "container_dai1\n" +
    "backend_daimainnet\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    "@webhook-Events_Dev\n" +
    "chain_xdai\n" +
    "host_2a\n" +
    "container_dai1\n" +
    "backend_daimainnet\n" +
    "event_NOT_SYNCHRONIZED_NOT_RESOLVED\n" +
    "\n" +
    'More than **1** log events matched in the last **1m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/shared-2b/kov"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Fri Aug 27 2021 21:13:52 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/1867792?to_ts=1630098832000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1630097932000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1867792/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1630098832000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1630097932000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22)]",
  id: "1867792",
  transition: "Re-Triggered",
  type: "error",
  title: "[P2] [Re-Triggered on {@conditions:NOT_SYNCHRONIZED}] Template",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6137720621515408572",
};
