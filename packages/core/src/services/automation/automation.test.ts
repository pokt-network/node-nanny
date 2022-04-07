import mongoose from "mongoose";
import { NodesModel, ChainsModel, HostsModel, LocationsModel } from "../../models";
import { Service } from "./service";

const automationService = new Service();

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

afterAll(async () => {
  await ChainsModel.deleteMany({});
  await LocationsModel.deleteMany({});
  await HostsModel.deleteMany({});
  await NodesModel.deleteMany({});
  await mongoose.disconnect();
});

const createMocks = async () => {
  const mockChain = { name: "TST", type: "TST", allowance: 5 };
  const chain = await ChainsModel.create(mockChain);
  const mockLocation = { name: "USE2" };
  const location = await LocationsModel.create(mockLocation);
  const mockHost = {
    name: "test/testypoo-2a",
    loadBalancer: false,
    location: location.id,
    ip: "12.34.56.0",
  };
  const host = await HostsModel.create(mockHost);
  const mockNode = {
    name: "TEST/test1/2a",
    chain: chain.id,
    host: host.id,
    port: 8810,
    url: `http://${host.ip}:8810`,
    loadBalancers: [host.id],
    backend: "testtestmainnet",
    server: "2a",
    haProxy: true,
  };
  const node = await NodesModel.create(mockNode);
  return { chain, location, host, node };
};

const nodeIds = ["622faff77d73779113cb8012", "622fb03e7d73779113cb8049"];
describe("Automation Service Tests", () => {
  describe("Get Logs Tests", () => {
    test("Should fetch paginated logs for a specific Node without timestamp query", async () => {
      const logsForNode = await automationService.getLogsForNode({
        nodeIds,
        page: 1,
        limit: 100,
      });

      expect(logsForNode).toBeTruthy();
    });

    test("Should fetch paginated logs for a specific Node with timestamps", async () => {
      const logsForNode = await automationService.getLogsForNode({
        nodeIds: ["622faff77d73779113cb8012"],
        startDate: "2022-03-16T21:43:36.367+00:00",
        endDate: "2022-03-18T21:43:36.367+00:00",
        page: 1,
        limit: 100,
      });

      expect(logsForNode).toBeTruthy();
    });
  });

  describe("Node Tests", () => {
    describe("Update Node Tests", () => {
      test("Should update one single node", async () => {
        const { node } = await createMocks();

        const newFields = {
          id: node.id,
          name: "test/testy123-2a",
          server: "2c",
          port: 5678,
          backend: null,
        };

        const updatedNode = await automationService.updateNode(newFields);

        expect(updatedNode.name).toEqual(newFields.name);
        expect(updatedNode.server).toEqual(newFields.server);
        expect(updatedNode.port).toEqual(newFields.port);
        expect(updatedNode.url).toEqual(
          node.url.replace(String(node.port), String(newFields.port)),
        );
        expect(updatedNode.backend).toEqual(node.backend);
      });
    });
  });
});
