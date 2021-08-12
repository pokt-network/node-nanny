import { Service } from "./service";
import { AlertChannel, Titles } from "./types";

const alert = new Service();

test("stop docker container then start with compose", async () => {
  //const res = await alert.processWebhookforReboot(criticalError);
  // console.log(res);
  expect(3).toBe(3);
});
//*critical_rop1_2a_testing
const criticalError = {
  type: "error",
  title: "[P1] [Triggered] [TEST] *critical_rop1_2b_testing",
  msg:
    "%%%\n" +
    "@webhook-AgentAPI_Test\n" +
    "\n" +
    "Test notification triggered by john@pokt.network.\n" +
    "\n" +
    'More than **2** log events matched in the last **5m** against the monitored query: **[service:"/pocket/nodemonitoring/shared-2b/rop" -status:(warn OR info OR ok) \\@conditions:NO_RESPONSE](https://app.datadoghq.eu/logs?query=service%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fpol%22+-status%3A%28warn+OR+info+OR+ok%29+%40conditions%3ANO_RESPONSE&agg_m=count&agg_t=count&index=)**\n' +
    "\n" +
    "The monitor was last triggered at Thu Aug 12 2021 17:01:16 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/1845218?to_ts=1628787676000&group=total&from_ts=1628786776000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#1845218/edit)] · [[Related Logs](https://app.datadoghq.eu/logs?index=%2A&to_ts=1628787676000&agg_t=count&agg_m=count&from_ts=1628786776000&live=false&query=service%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2b%2Fpol%22+-status%3A%28warn+OR+info+OR+ok%29+%40conditions%3ANO_RESPONSE)]",
  id: "1845218",
};
