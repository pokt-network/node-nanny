import { Service } from "./service";
import { AlertChannel, Titles } from "./types";

const alert = new Service();

test("stop docker container then start with compose", async () => {
const res =  await alert.processWebhookforReboot(criticalError)
  console.log(res)
  expect(3).toBe(3);
});

const criticalError = {
  type: 'error',
  title: '[Triggered] [TEST] *critical_rop1_2a_testing',
  msg: '%%%\n' +
    '@webhook-AgentAPI\n' +
    '\n' +
    'This host is either offline or failing to respond.\n' +
    '\n' +
    'Test notification triggered by john@pokt.network.\n' +
    '\n' +
    'More than **2** log events matched in the last **5m** against the monitored query: **[service:"/pocket/nodemonitoring/shared-2b/fus" -status:(warn OR info OR ok) \\@conditions:NO_RESPONSE](https://app.datadoghq.eu/logs?query=service%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Ffus%22+-status%3A%28warn+OR+info+OR+ok%29+%40conditions%3ANO_RESPONSE&agg_m=count&agg_t=count&index=)**\n' +
    '\n' +
    'The monitor was last triggered at Thu Aug 12 2021 01:19:43 UTC.\n' +
    '\n' +
    '- - -\n' +
    '\n' +
    '[[Monitor Status](https://app.datadoghq.eu/monitors/1845673?to_ts=1628731183000&group=total&from_ts=1628730283000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1845673/edit)] · [[Related Logs](https://app.datadoghq.eu/logs?index=%2A&to_ts=1628731183000&agg_t=count&agg_m=count&from_ts=1628730283000&live=false&query=service%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Ffus%22+-status%3A%28warn+OR+info+OR+ok%29+%40con'
}


