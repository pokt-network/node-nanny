import { Service } from "./service";

const service = new Service();

test("", async () => {

  const status = await service.getServerCount({backend: "bscmainnet"});
  console.log(status);


  expect(3).toBe(3);
});
