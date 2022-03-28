import { connect, disconnect } from "../../db";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

test("should check peer health for more than one", async () => {
  //const status = await event.isPeersOk({chain:"hrm", nodeId: "6176bc3272237b0011a6a740"})
  // const status = await event.getBackendServerCount("bscmainnet");
  // console.log(status);
  // expect(1).toEqual(1);
});
