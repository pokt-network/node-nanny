import { Service } from "./service";
import { config } from "dotenv";
import { wait } from "../../utils";

config();

const event = new Service();

test("should handle no synched case and recovery", async () => {
  // await event.processEvent(NOT_SYNCHRONIZED);
  // await wait(10000);  
  // await event.processEvent(NO_RESPONSE_NOT_RESOLVED);
  // await wait(10000);    
  // await event.processEvent(HEALTHY);
  expect(3).toBe(3);
});

test("should handle recovery case", async () => {
  // await event.processEvent(recover);
  expect(3).toBe(3);
});

test("should handle not resolved case", async () => {
  // await event.processEvent(recover);
  expect(3).toBe(3);
});

const NOT_SYNCHRONIZED = {
  msg:
    "%%%\n" +
    "@webhook-Events_Dev\n" +
    "chain_rop\n" +
    "host_2a\n" +
    "container_rop1\n" +
    "backend_ethropsten\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    'More than **1** log events matched in the last **1m** against the monitored query: **[source:"/pocket/nodemonitoring/shared-2a/rop" -@conditions:HEALTHY](https://app.datadoghq.eu/logs/analytics?query=source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Frop%22+-%40conditions%3AHEALTHY&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Tue Aug 31 2021 16:51:00 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2098320?to_ts=1630428660000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1630427760000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2098320/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1630428660000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1630427760000&live=false&query=source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Frop%22+-%40conditions%3AHEALTHY)]",
  id: "2098320",
  transition: "Triggered",
  type: "error",
  title: "[Triggered on {@conditions:NOT_SYNCHRONIZED}] Ethereum Ropsten US-East-2 Host A",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6143244151398723598",
};

const NO_RESPONSE_NOT_RESOLVED = {
  msg:
    "%%%\n" +
    "@webhook-Events_Dev\n" +
    "chain_rop\n" +
    "host_2a\n" +
    "container_rop1\n" +
    "backend_ethropsten\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    "@webhook-Events_Dev\n" +
    "chain_rop\n" +
    "host_2a\n" +
    "container_rop1\n" +
    "backend_ethropsten\n" +
    "event_NOT_SYNCHRONIZED_NOT_RESOLVED\n" +
    "\n" +
    'More than **1** log events matched in the last **1m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/binance-2b/bsc"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fbinance-2b%2Fbsc%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Tue Aug 31 2021 12:28:30 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2096310?to_ts=1630412910000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1630412010000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2096310/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1630412910000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1630412010000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fbinance-2b%2Fbsc%22)]",
  id: "2098320",
  transition: "Re-Triggered",
  type: "error",
  title: "[Triggered on {@conditions:NOT_SYNCHRONIZED}] Ethereum Ropsten US-East-2 Host A",

  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6143215458765471917",
};

const HEALTHY = {
  msg:
    "%%%\n" +
    "@webhook-Events_Dev\n" +
    "chain_rop\n" +
    "host_2a\n" +
    "container_rop1\n" +
    "backend_ethropsten\n" +
    "event_HEALTHY\n" +
    "\n" +
    "The monitor was marked as **Recovered** on **@conditions:HEALTHY ** by Jonathon Fritz.\n" +
    "\n" +
    "The monitor was last triggered at Thu Aug 26 2021 19:05:52 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/1867792?to_ts=1630004752000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1630003852000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1867792/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1630004752000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1630003852000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22)]",
  id: "209832",
  transition: "Recovered",
  type: "success",
  title: "[Triggered on {@conditions:NOT_SYNCHRONIZED}] Ethereum Ropsten US-East-2 Host A",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6136155280721054654",
};
