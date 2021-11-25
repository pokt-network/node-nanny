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
    "@webhook-infra-discord-prod\n" +
    "\n" +
    "Test notification triggered by john@pokt.network.\n" +
    "\n" +
    "More than **1000** log events matched in the last **5m** against the monitored query: **[\\@elapsedTime:>6](https://app.datadoghq.eu/logs/analytics?query=%40elapsedTime%3A%3E6&agg_m=count&agg_t=count&agg_q=%40blockchainID%2Cregion%2C%40serviceDomain%2Cservice&index=)** by **@blockchainID,region,\\@serviceDomain,service**\n" +
    "\n" +
    "The monitor was last triggered at Thu Nov 25 2021 18:08:07 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/3288509?to_ts=1637863987000&group=%40blockchainID%3A0001%2Cregion%3Aap-southeast-1%2C%40serviceDomain%3A2jx.com%2Cservice%3Aap-southeast-1%2Fecs%2Fgateway&from_ts=1637862787000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#3288509/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1637863987000&agg_t=count&agg_m=count&agg_q=%40blockchainID%2Cregion%2C%40serviceDomain%2Cservice&from_ts=1637862787000&live=false&query=%40elapsedTime%3A%3E6)]",
  id: "3288509",
  transition: "Triggered",
  type: "error",
  title:
    "[Triggered on {@blockchainID:0001,region:ap-southeast-1,@serviceDomain:2jx.com,service:ap-southeast-1/ecs/gateway}] [TEST] High latency for 0001 ap-southeast-1 2jx.com ap-southeast-1/ecs/gateway",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6267981680323712000",
  tags:
    "blockchainid:0001,critical,latency,monitor,region:ap-southeast-1,service:ap-southeast-1/ecs/gateway,servicedomain:2jx.com",
};
