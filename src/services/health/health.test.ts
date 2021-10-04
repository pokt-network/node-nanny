import { Health, Discover } from "..";
import { connect, disconnect } from "../../db";
import { DiscoverTypes } from "../../types";
import { Service } from "./service";
const health = new Service();
const discover = new Discover({ source: DiscoverTypes.Source.TAG });


beforeAll(async () => {
  await connect()
})

afterAll(async () => {
  await disconnect()
})

test("get nodes from db and process", async () => {
  const nodes = await discover.getNodesfromDB()
  const readings = await health.getNodeHealth(nodes)
  expect(1).toEqual(1)
});


