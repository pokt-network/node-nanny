import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Retool, DataDog, Log, Event } from "./services";
const dd = new DataDog();
const retool = new Retool();
const log = new Log();
const event = new Event();
const fix = async () => {
  await connect();
  const res = await event.checkPocketPeers({nodeId:"6180301de7ac7300119d6c93", poktType: "dis"});
  console.log(res);
  return "done";
};

fix().then(console.log);

const sol = {
  msg:
    "%%%\n" +
    "@webhook-events-production \n" +
    "nodeId_618daf38ae64bb00118ddf0c\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/solana/arweave-2a/sol"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fsolana%2Farweave-2a%2Fsol%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Fri Nov 12 2021 00:07:58 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2613898?to_ts=1636675678000&group=%40conditions%3ANO_RESPONSE&from_ts=1636674778000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2613898/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1636675678000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1636674778000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fsolana%2Farweave-2a%2Fsol%22)]",
  id: "2613898",
  transition: "Triggered",
  type: "error",
  title: "[Recovered on {@conditions:NOT_SYNCHRONIZED}] SOLANA/ARWEAVE-2A/SOL",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6248057762773791815",
};
