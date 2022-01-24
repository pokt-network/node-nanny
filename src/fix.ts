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

const fix = async () => {
  await connect();

  const allNodes = await NodesModel.find({  monitorId: null }).exec();

  for (const node of allNodes) {
    console.log(node);
  }
  // await event.processEvent(proccess);
  return {};
};

fix().then(console.log);

const proccess = {
  msg:
    "%%%\n" +
    "@webhook-events-production\n" +
    "nodeId_61eb0705da1b8a00123fc55e\n" +
    "event_NOT_SYNCHRONIZED\n" +
    "\n" +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error service:"/pocket/nodemonitoring/ethereum-2e/eth/eri1"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+service%3A%22%2Fpocket%2Fnodemonitoring%2Fethereum-2e%2Feth%2Feri1%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Fri Jan 21 2022 19:20:58 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/4089418?to_ts=1642793158000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1642791958000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#4089418/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1642793158000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1642791958000&live=false&query=status%3Aerror+service%3A%22%2Fpocket%2Fnodemonitoring%2Fethereum-2e%2Feth%2Feri1%22)]",
  id: "4089418",
  transition: "Triggered",
  type: "error",
  title: "[Triggered on {@conditions:NOT_SYNCHRONIZED}] ETHEREUM-2E/ETH/ERI1",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6350680971864100470",
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

//createChans("916127579331772467").then(console.log);
