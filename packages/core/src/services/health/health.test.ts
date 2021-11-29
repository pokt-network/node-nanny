import { Health } from "..";
import { connect, disconnect } from "../../db";
import { Service } from "./service";
const health = new Service();
beforeAll(async () => {
  await connect()
})

afterAll(async () => {
  await disconnect()
})

test("", async () => {
  // const nodes = await discover.getNodesfromDB()
  // const readings = await health.getNodeHealth(nodes)

  //const response = await health.getSolHealth({url:'http://3.132.78.76:8899', name:'test'})
  //console.log(response)
  expect(1).toEqual(1)
});


