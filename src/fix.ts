import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Retool, DataDog, Log, Event } from "./services";
const dd = new DataDog();
const retool = new Retool();
const log = new Log();
const event = new Event();
const fix = async () => {
  await connect();
  //await event.processEvent(dis)
  // const allNodes = await NodesModel.find({});

  // for (const { logGroup } of allNodes) {
  //   const res = await log.setRetentionPeriod(logGroup);
  //   console.log(res);
  // }

  return "done";
};

fix().then(console.log);

const dis = {
  msg:
    "%%%\n" +
    "@webhook-events-production \n" +
    "nodeId_6169feac6ac86b0010568e45\n" +
    "event_NO_RESPONSE\n" +
    "\n" +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/dispatch-4.nodes.pokt.network"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-4.nodes.pokt.network%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Fri Nov 12 2021 16:55:58 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2742898?to_ts=1636736158000&group=%40conditions%3ANO_RESPONSE&from_ts=1636735258000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2742898/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1636736158000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1636735258000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-4.nodes.pokt.network%22)]",
  id: "2742898",
  transition: "Triggered",
  type: "error",
  title: "[Triggered on {@conditions:NO_RESPONSE}] DISPATCH-4.NODES.POKT.NETWORK",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6249066407093886828",
};
