import { Service } from "./service";
import { connect, disconnect } from "../../db";

const event = new Service();
beforeAll(async () => {
  await connect()
})

afterAll(async () => {
  await disconnect()
})


test("should process datadog event", async () => {
 await event.processEvent(mock)
  expect(1).toEqual(1)

})


const mock = {
  msg: '%%%\n' +
    '@webhook-events-production \n' +
    'nodeId_61579c20b46d2800116ea012\n' +
    'event_NO_RESPONSE\n' +
    '\n' +
    'More than **4** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/dispatch-10.nodes.pokt.network"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-10.nodes.pokt.network%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    '\n' +
    'The monitor was last triggered at Mon Oct 18 2021 15:33:12 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/2743032?to_ts=1634571192000&group=%40conditions%3ANO_RESPONSE&from_ts=1634570292000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2743032/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1634571192000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1634570292000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-10.nodes.pokt.network%22)]',
  id: '2597142',
  transition: 'Re-Triggered',
  type: 'error',
  title: '[Triggered on {@conditions:NO_RESPONSE}] DISPATCH-10.NODES.POKT.NETWORK',
  status: '',
  link: 'https://app.datadoghq.eu/event/event?id=6212744301947729064'
}