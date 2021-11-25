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
  msg: '%%%\n' +
    '@webhook-infra-discord-prod\n' +
    '\n' +
    'More than **1000** log events matched in the last **5m** against the monitored query: **[\\@elapsedTime:>6](https://app.datadoghq.eu/logs/analytics?query=%40elapsedTime%3A%3E6&agg_m=count&agg_t=count&agg_q=%40blockchainID%2Cregion%2C%40serviceDomain%2Cservice&index=)** by **@blockchainID,region,\\@serviceDomain,service**\n' +
    '\n' +
    'The monitor was last triggered at Thu Nov 25 2021 19:19:29 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/3288509?to_ts=1637868269000&group=%40blockchainID%3A0021%2C%40serviceDomain%3Apokt.network%2Cregion%3Aeu-south-1%2Cservice%3Aeu-south-1%2Fecs%2Fgateway&from_ts=1637867069000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#3288509/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1637868269000&agg_t=count&agg_m=count&agg_q=%40blockchainID%2Cregion%2C%40serviceDomain%2Cservice&from_ts=1637867069000&live=false&query=%40elapsedTime%3A%3E6)]',
  id: '3288509',
  transition: 'Triggered',
  type: 'error',
  title: '[Triggered on {@blockchainID:0021,@serviceDomain:pokt.network,region:eu-south-1,service:eu-south-1/ecs/gateway}] High latency for 0021 eu-south-1 pokt.network eu-south-1/ecs/gateway',
  status: '',
  link: 'https://app.datadoghq.eu/event/event?id=6268055052538438929',
  tags: 'blockchainid:0021,critical,latency,monitor,region:eu-south-1,service:eu-south-1/ecs/gateway,servicedomain:pokt.network'
}
