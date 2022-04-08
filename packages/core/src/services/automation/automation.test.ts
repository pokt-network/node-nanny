import mongoose from "mongoose";
import {
  NodesModel,
  ChainsModel,
  HostsModel,
  LocationsModel,
  IChain,
  ILocation,
  IHost,
  INode,
} from "../../models";
import { Service } from "./service";

const automationService = new Service();
let chain: IChain, location: ILocation, host: IHost, node: INode;

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

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
  ({ chain, location, host, node } = await createMocks());
});

afterAll(async () => {
  await ChainsModel.deleteMany({});
  await LocationsModel.deleteMany({});
  await HostsModel.deleteMany({});
  await NodesModel.deleteMany({});
  await mongoose.disconnect();
});

const nodeIds = ["622faff77d73779113cb8012", "622fb03e7d73779113cb8049"];
describe("Automation Service Tests", () => {
  describe("Get Logs Tests", () => {
    test("Should fetch paginated logs for a specific Node without timestamp query", async () => {
      const logsForNode = await automationService.getLogsForNodes({
        nodeIds,
        page: 1,
        limit: 100,
      });

      expect(logsForNode).toBeTruthy();
    });

    test("Should fetch paginated logs for a specific Node with timestamps", async () => {
      const logsForNode = await automationService.getLogsForNodes({
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
        const update = {
          id: node.id.toString(),
          name: "test/testy123/2a",
          server: "2c",
          port: 5678,
          backend: null,
        };

        const updatedNode = await automationService.updateNode(update);

        expect(updatedNode.name).toEqual(update.name);
        expect(updatedNode.server).toEqual(update.server);
        expect(updatedNode.port).toEqual(update.port);
        expect(updatedNode.url).toEqual(
          node.url.replace(String(node.port), String(update.port)),
        );
        expect(updatedNode.backend).toEqual(null);
      });
    });

    describe("Delete Node Tests", () => {
      test("Should delete one single node", async () => {
        const nodeExists = !!(await NodesModel.exists({ _id: node.id }));
        await automationService.deleteNode(node.id.toString());
        const nodeDeleted = !(await NodesModel.exists({ _id: node.id }));

        expect(nodeExists).toEqual(true);
        expect(nodeDeleted).toEqual(true);
      });
    });
  });

  describe("Host Tests", () => {
    describe("Update Host Tests", () => {
      test("Should update one single host", async () => {
        const update = {
          id: host.id.toString(),
          name: "test/testicule-2c",
          loadBalancer: true,
          ip: "86.75.30.9",
        };

        const updatedHost = await automationService.updateHost(update);

        expect(updatedHost.name).toEqual(update.name);
        expect(updatedHost.loadBalancer).toEqual(update.loadBalancer);
        expect(updatedHost.ip).toEqual(update.ip);
      });
    });

    describe("Delete Host Tests", () => {
      test("Should delete one single host", async () => {
        const hostExists = !!(await HostsModel.exists({ _id: host.id }));
        await automationService.deleteHost(host.id.toString());
        const hostDeleted = !(await HostsModel.exists({ _id: node.id }));

        expect(hostExists).toEqual(true);
        expect(hostDeleted).toEqual(true);
      });
    });
  });
});
