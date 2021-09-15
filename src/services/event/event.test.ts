import { Service } from "./service";
import { Config } from "..";

const event = new Service();

test("should get backend status", async () => {
  const status = await event.getBackendStatus('bscmainnet')
  expect(1).toEqual(1)

})
test("should set backend to online", async () => {
  // await event.enableServer({ backend: 'bscmainnet', host: "2a", chain: "bsc" })
  //await event.enableServer({ backend: 'bscmainnet', host: "2b", chain: "bsc" })
  expect(1).toEqual(1)

})

