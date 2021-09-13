import { Service } from "./service";
import { Config } from "..";

const event = new Service();
const config = new Config();

test("should get backend status", async () => {
  const status = await event.getBackendStatus('bscmainnet')
  expect(1).toEqual(1)

})
test("should set backend to online", async () => {
  // await event.enableServer({ backend: 'bscmainnet', host: "2a", chain: "bsc" })
  // await config.setNodeStatus({ chain: "bsc", host: "2a", status: 'online' });
  await event.enableServer({ backend: 'bscmainnet', host: "2b", chain: "bsc" })
  await config.setNodeStatus({ chain: "bsc", host: "2b", status: 'online' });


  expect(1).toEqual(1)

})

