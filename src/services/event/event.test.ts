import { Service } from "./service";
import { Config } from "..";

const event = new Service();

// test("should get backend status", async () => {
//   const status = await event.getBackendStatus('bscmainnet')
//   expect(1).toEqual(1)

// })
test("should set backend to online", async () => {
  await event.processEvent(mock)

  // await event.enableServer({ backend: 'bscmainnet', host: "2a", chain: "bsc" })
  //await event.enableServer({ backend: 'bscmainnet', host: "2b", chain: "bsc" })
  expect(1).toEqual(1)

})

const mock = {
  msg: '%%%\n' +
    '@webhook-events-production\n' +
    'chain_kov\n' +
    'host_2b\n' +
    'container_kov1\n' +
    'backend_ethkovan\n' +
    'event_NO_RESPONSE\n' +
    '\n' +
    'More than **1** log events matched in the last **1m** against the monitored query: **[source:"/pocket/nodemonitoring/shared-2b/kov" -@conditions:HEALTHY](https://app.datadoghq.eu/logs/analytics?query=source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22+-%40conditions%3AHEALTHY&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    '\n' +
    'The monitor was last triggered at Wed Sep 15 2021 22:05:12 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/2098152?to_ts=1631743512000&group=%40conditions%3ANO_RESPONSE&from_ts=1631742612000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2098152/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1631743512000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1631742612000&live=false&query=source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fkov%22+-%40conditions%3AHEALTHY)]',
  id: '2098152',
  transition: 'Triggered',
  type: 'error',
  title: '[Triggered on {@conditions:NO_RESPONSE}] Ethereum Kovan US-East-2 Host B',
  status: '',
  link: 'https://app.datadoghq.eu/event/event?id=6165303706861805119'
}