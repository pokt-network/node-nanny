import { connect } from "./db";
const { Client, Intents } = require("discord.js");

import { INode, NodesModel, IOracle, OraclesModel, ChainsModel, WebhookModel } from "./models";
import { Alert, Retool, DataDog, Log, Event, Health, Infra } from "./services";
const alert = new Alert();
const dd = new DataDog();
const retool = new Retool();
const log = new Log();
const event = new Event();
const health = new Health();
const infra = new Infra();

const names = [
  {
    name: "POKT-DIS",
    url:
      "https://discord.com/api/webhooks/922563249025745006/QZIWRfQaXkZGMcISUDDTsLi3xFuP8R0nZjVOUabCNUQUdbMbC0_yG1RuKASm7jWifuNy",
  },
  {
    name: "POKT-MAIN",
    url:
      "https://discord.com/api/webhooks/922563510356041849/z-mmqlmebRBnr2TyhcMMCA4nUvG-0TnXyH9UllzZnQZ94xv7BwKQESllSa-7eRc3lSiC",
  },
];
const fix = async () => {
  await connect();

  // for (const { name, url } of names) {
  //   const res = await WebhookModel.create({ chain: name, url: url });
  //   console.log(res);
  // }

  // const res = await NodesModel.updateMany(
  //   { poktType: "dis" },
  //   { $set: { "chain.name": "POKT-DIS" } },
  // );
  // console.log(res);
  // //await event.processEvent(proccess)
  return {};
};

//fix().then(console.log);

const proccess = {
  msg:
    "%%%\n" +
    "@webhook-events-production \n" +
    "nodeId_61562f1463b1e300111c35e9\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error service:"/pocket/nodemonitoring/ethereum-2a/eth"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+service%3A%22%2Fpocket%2Fnodemonitoring%2Fethereum-2a%2Feth%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Fri Dec 17 2021 21:35:35 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2528855?to_ts=1639777235000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1639776035000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2528855/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1639777235000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1639776035000&live=false&query=status%3Aerror+service%3A%22%2Fpocket%2Fnodemonitoring%2Fethereum-2a%2Feth%22)]",
  id: "2528855",
  transition: "Triggered",
  type: "error",
  title: "[Triggered on {@conditions:NOT_SYNCHRONIZED}] ETHEREUM-2A/ETH",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6300082168651089235",
};

const createChans = async (server) => {
  await connect();
  var guild = server;
  const chains = await ChainsModel.find({});

  for (const { name } of chains) {
    await WebhookModel.create({ chain: name, url: "" });
  }

  return {};

  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

  // // When the client is ready, run this code (only once)
  client.once("ready", async () => {
    const server = client.guilds.cache.get(guild);
    const category = await server.channels.create("Blockchain Monitoring", {
      type: "GUILD_CATEGORY",
    });

    for (const { name } of chains) {
      await server.channels.create(name, {
        type: "text",
        parent: category,
      });

      await WebhookModel.create({ chain: name, url: "" });
    }
  });

  // // Login to Discord with your client's token
  client.login(process.env.DISCORD_TOKEN);
};

createChans("916127579331772467").then(console.log);
