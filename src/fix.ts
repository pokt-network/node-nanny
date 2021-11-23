import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Retool, DataDog, Log, Event, Health, Infra } from "./services";
const dd = new DataDog();
const retool = new Retool();
const log = new Log();
const event = new Event();
const health = new Health();
const infra = new Infra();
const fix = async () => {
  await connect();
  const res = await infra.processEvent(proccess);
  return res;
};

fix().then(console.log);

const proccess = {
  msg:
    "%%%\n" +
    "@webhook-lambda_testing\n" +
    "\n" +
    "Test notification triggered by john@pokt.network.\n" +
    "\n" +
    "\n" +
    "\n" +
    "[![Metric Graph](https://p.datadoghq.eu/snapshot/view/dd-snapshots-eu1-prod/org_1000049589/2021-11-23/287b07a42e4b6381c145953a9f08389f2c3fc856.png)](https://app.datadoghq.eu/monitors/2541094?to_ts=1637697474000&group=story_key%3Ad6383889b13eae599cdfe7632cf40163%2Cstory_type%3Afull_disk_forecast&from_ts=1637690214000)\n" +
    "\n" +
    "The monitor was last triggered at Tue Nov 23 2021 19:56:53 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2541094?to_ts=1637697713000&group=story_key%3Ad6383889b13eae599cdfe7632cf40163%2Cstory_type%3Afull_disk_forecast&from_ts=1637696513000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2541094/edit)] · [[View Watchdog Story](https://app.datadoghq.eu/apm/watchdog/story/d6383889b13eae599cdfe7632cf40163)]",
  id: "2541094",
  transition: "Triggered",
  type: "error",
  title:
    "[Triggered] [TEST] [Watchdog] Infrastructure Story detected - A disk on 1 host may be full  within 5 days",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6265192075778187146",
};
