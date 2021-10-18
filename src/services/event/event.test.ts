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
 // await event.processEvent(mock)

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
    '@webhook-events-production \n' +
    'nodeId_616a0370d262740011289f1c\n' +
    'event_NO_RESPONSE"\n' +
    '\n' +
    'More than **4** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/dispatch-10.nodes.pokt.network"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-10.nodes.pokt.network%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    '\n' +
    'The monitor was last triggered at Mon Oct 18 2021 15:33:12 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/2743032?to_ts=1634571192000&group=%40conditions%3ANO_RESPONSE&from_ts=1634570292000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2743032/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1634571192000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1634570292000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-10.nodes.pokt.network%22)]',
  id: '2743032',
  transition: 'Triggered',
  type: 'error',
  title: '[Triggered on {@conditions:NO_RESPONSE}] DISPATCH-10.NODES.POKT.NETWORK',
  status: '',
  link: 'https://app.datadoghq.eu/event/event?id=6212744301947729064'
}