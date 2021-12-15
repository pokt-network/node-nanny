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
  await event.processEvent(proccess)
  return {}
};

fix().then(console.log);

const proccess = {
  msg: '%%%\n' +
    '@webhook-events-production\n' +
    'nodeId_61803b30fdf81300119b6307\n' +
    'event_NO_RESPONSE\n' +
    '\n' +
    '@webhook-events-production \n' +
    'nodeId_61803b30fdf81300119b6307\n' +
    'event_NO_RESPONSE_NOT_RESOLVED\n' +
    '\n' +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error service:"/pocket/nodemonitoring/mainnet-10.nodes.pokt.network"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+service%3A%22%2Fpocket%2Fnodemonitoring%2Fmainnet-10.nodes.pokt.network%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    '\n' +
    'The monitor was last triggered at Tue Dec 14 2021 12:28:36 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/2969316?to_ts=1639592616000&group=%40conditions%3ANO_RESPONSE&from_ts=1639591416000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2969316/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1639592616000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1639591416000&live=false&query=status%3Aerror+service%3A%22%2Fpocket%2Fnodemonitoring%2Fmainnet-10.nodes.pokt.network%22)]',
  id: '2969316',
  transition: 'Re-Triggered',
  type: 'error',
  title: '[Re-Triggered on {@conditions:NO_RESPONSE}] MAINNET-10.NODES.POKT.NETWORK',
  status: '',
  link: 'https://app.datadoghq.eu/event/event?id=6296984784093566340'
};

const createChans = async (server) => {
  await connect();
  var guild = server;
  const chains = await ChainsModel.find({});

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
