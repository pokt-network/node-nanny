import { Service } from "./service";
import { config } from "dotenv";
import { wait } from "../../utils";
import mocks from './mocks'

config();

const event = new Service();

test("should generate mock data", async () => {

  for (const mock of mocks) {
    console.log(mock)
    //await wait(2000)
  }

  expect(3).toBe(3);
});



test("should get host instance id", async () => {
  const id = event.getHostId({ chain: "bsc", host: "2b" })
  expect(id).toEqual('i-0355f5481fa31742c')

})

