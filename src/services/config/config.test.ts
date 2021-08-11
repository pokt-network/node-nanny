import { Service } from "./service";

const service = new Service();

test("should fetch multiple params by prefix", async () => {
  const params = await service.getParamsByPrefix(`/pocket/monitoring/config/pocketNodes`);
  expect(Array.isArray(params)).toBe(true);
  expect(params[0]).toHaveProperty("Name");
  expect(params[0]).toHaveProperty("Value");
});
