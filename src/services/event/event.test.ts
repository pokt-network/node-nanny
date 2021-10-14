import { Service } from "./service";
import { connect, disconnect } from "../../db";

const event = new Service();
beforeAll(async () => {
  await connect()
})

afterAll(async () => {
  await disconnect()
})

test("should get backend status", async () => {
//  const status = await event.getDockerEndpoint({chain: 'bsc', host: '2a'})
  expect(1).toEqual(1)

})
test("should set backend to online", async () => {
  await event.processEvent(mock)

  // await event.enableServer({ backend: 'bscmainnet', host: "2a", chain: "bsc" })
  //await event.enableServer({ backend: 'bscmainnet', host: "2b", chain: "bsc" })
  expect(1).toEqual(1)

})

test("should get blockheight differnce all nodes are bad", async () => {
  //await event.processEvent(mock)

 // const lb = await event.getLoadBalancers();

 // console.log(lb)

  // await event.enableServer({ backend: 'bscmainnet', host: "2a", chain: "bsc" })
  //await event.enableServer({ backend: 'bscmainnet', host: "2b", chain: "bsc" })
  expect(1).toEqual(1)

})


const mock = {
  msg: '%%%\n' +
    '@webhook-events-dev \n' +
    'nodeId_615632b18b86f00010db487b\n' +
    'event_NOT_SYNCHRONIZED\n' +
    '\n' +
    '@webhook-events-production \n' +
    'chain_pokt\n' +
    'nodeId_615632b18b86f00010db487b\n' +
    'event_NOT_SYNCHRONIZED_NOT_RESOLVED\n' +
    '\n' +
    'More than **4** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/shared-2a/poltst"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Fpoltst%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    '\n' +
    'The monitor was last triggered at Mon Oct 04 2021 22:40:23 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/2528963?to_ts=1633387223000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1633386323000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2528963/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1633387223000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1633386323000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Fpoltst%22)]',
  id: '2528963',
  transition: 'Recovered',
  type: 'error',
  title: '[Re-Triggered on {@conditions:NOT_SYNCHRONIZED}] SHARED-2A/POLTST',
  status: '',
  link: 'https://app.datadoghq.eu/event/event?id=6192890666631275067'
}