import { Service } from "./service/datadog";
import { connect, disconnect } from "../../db";

const event = new Service();
beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

test("should check peer health for more than one", async () => {
  //const status = await event.isPeersOk({chain:"hrm", nodeId: "6176bc3272237b0011a6a740"})

  const status = await event.getBackendServerCount("bscmainnet");

  console.log(status);

  expect(1).toEqual(1);
});

const mock = {
  msg:
    "%%%\n" +
    "@webhook-events-production \n" +
    "nodeId_6169e45779209c001227275e\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/harmony-2a/hrm"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fharmony-2a%2Fhrm%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Mon Nov 01 2021 18:40:44 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2742104?to_ts=1635792044000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1635791144000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2742104/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1635792044000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1635791144000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fharmony-2a%2Fhrm%22)]",
  id: "2742104",
  transition: "Triggered",
  type: "error",
  title: "[Triggered on {@conditions:NOT_SYNCHRONIZED}] HARMONY-2A/HMY",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6233226812642648407",
};
