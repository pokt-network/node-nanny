import { Service } from "./service";

const event = new Service();


test("should get host instance id", async () => {
  const id = event.getHostId({ chain: "bsc", host: "2b" })
  expect(id).toEqual('i-0355f5481fa31742c')

})

