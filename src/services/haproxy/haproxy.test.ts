import { Service } from "./service";

const service = new Service();

test("", async () => {

  const status = await service.getStatus({backend: "ethmainnet", server: "2a"});
  console.log(status);



  expect(3).toBe(3);
});
