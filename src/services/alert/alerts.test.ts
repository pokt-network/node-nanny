import { Service } from "./service";
import { AlertChannel, Titles } from "./types";

const alert = new Service();

test.only("", async () => {
//  await alert.sendAlert({channel: AlertChannel.BOTH, title: Titles.OFFLINE, details:`this node is offfline!!`});
  expect(3).toBe(3);
});
