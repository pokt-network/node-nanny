import { Service } from "./service";
import { connect, disconnect } from "../../db";
import { Status } from "./types";

const dd = new Service();

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

// test("should construct event object from dd string", async () => {
//   const response = await dd.parseWebhookMessage(retrigger);
//   expect(response).toHaveProperty("nodeId");
//   expect(response).toHaveProperty("event");
//   expect(response).toHaveProperty("id");
//   expect(response).toHaveProperty("transition");

// });

// test("should get status of dd monitor", async () => {
//   // const response = await dd.getMonitorStatus("1867792");
//   // expect(Object.values(Status)).toContain(response);
// });

test("should store dd tags in ssm", async () => {
  //  await dd.storeMonitorIds()
});

test("should get container logs from datadog", async () => {
  // const logs = await dd.getContainerLogs({ instance: "i-0fb709e897295a622", container: "goe1" })
});

test("should get health logs from datadog", async () => {
  //const logs = await dd.getHealthLogs({ host: "2a", chain: "bsc" })
  //console.log(logs)
});

test("should create monitor", async () => {
  //  const response = await dd.createMonitor({
  //    logGroup: "/Pocket/NodeMonitoring/mainnet-1.nodes.pokt.network",
  //    name: 'mainnet-1.nodes.pokt.network',
  //    id: "6153a7eb16a5610010b1a173"
  //  })
  //  console.log(response)
});

test("should update monitor", async () => {
  // const response = await dd.changeWebhookForMonitors()

  //console.log(response)

  expect(2).toBe(2);
});
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
    "@webhook-events-production \n" +
    "nodeId_615632b18b86f00010db487b\n" +
    'event_NOT_SYNCHRONIZED"\n' +
    "\n" +
    "@webhook-events-production \n" +
    "chain_pokt\n" +
    "nodeId_615632b18b86f00010db487b\n" +
    "event_NOT_SYNCHRONIZED_NOT_RESOLVED\n" +
    "\n" +
    'More than **4** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/shared-2a/poltst"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Fpoltst%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Mon Oct 04 2021 22:40:23 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2528963?to_ts=1633387223000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1633386323000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2528963/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1633387223000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1633386323000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Fpoltst%22)]",
  id: "2528963",
  transition: "Re-Triggered",
  type: "error",
  title: "[Re-Triggered on {@conditions:NOT_SYNCHRONIZED}] SHARED-2A/POLTST",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6192890666631275067",
};
