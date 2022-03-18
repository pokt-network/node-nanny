import { Service } from "./service";
import { connect, disconnect } from "../../db";

const automationService = new Service();

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("Automation Service Tests", () => {
  describe("Get Logs Tests", () => {
    test("Should fetch logs for a specific Node without timestamp query", async () => {
      const logsForNode = await automationService.getLogsForNode({
        nodeIds: ["622faff77d73779113cb8012"],
      });

      expect(logsForNode).toBeTruthy();
      expect(logsForNode.length).toBeGreaterThan(10);
    });

    test("Should fetch logs for a specific Node with timestamps", async () => {
      const logsForNode = await automationService.getLogsForNode({
        nodeIds: ["622faff77d73779113cb8012"],
        startDate: "2022-03-16T21:43:36.367+00:00",
        endDate: "2022-03-18T21:43:36.367+00:00",
      });

      expect(logsForNode).toBeTruthy();
      expect(logsForNode.length).toBeGreaterThan(10);
    });
  });
});
