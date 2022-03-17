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
      console.time("time without timestamp");
      const logsForNode = await automationService.getLogsForNode({
        nodeId: "622faff77d73779113cb8012",
      });
      console.timeEnd("time without timestamp");

      expect(logsForNode).toBeTruthy();
      expect(logsForNode.length).toBeGreaterThan(10);
    });

    test("Should fetch logs for a specific Node with a start timestamp", async () => {
      console.time("time with start timestamp");
      const logsForNode = await automationService.getLogsForNode({
        nodeId: "622faff77d73779113cb8012",
        startDate: "2022-03-16T21:43:36.367+00:00",
      });
      console.timeEnd("time with start timestamp");

      console.debug("FOUND", logsForNode.length);

      expect(logsForNode).toBeTruthy();
      expect(logsForNode.length).toBeGreaterThan(10);
    });

    test("Should fetch logs for a specific Node with an end timestamp", async () => {
      console.time("time with start timestamp");
      const logsForNode = await automationService.getLogsForNode({
        nodeId: "622faff77d73779113cb8012",
        endDate: "2022-03-18T21:43:36.367+00:00",
      });
      console.timeEnd("time with start timestamp");

      console.debug("FOUND", logsForNode.length);

      expect(logsForNode).toBeTruthy();
      expect(logsForNode.length).toBeGreaterThan(10);
    });

    test("Should fetch logs for a specific Node with both timestamps", async () => {
      console.time("time with start timestamp");
      const logsForNode = await automationService.getLogsForNode({
        nodeId: "622faff77d73779113cb8012",
        startDate: "2022-03-16T21:43:36.367+00:00",
        endDate: "2022-03-18T21:43:36.367+00:00",
      });
      console.timeEnd("time with start timestamp");

      console.debug("FOUND", logsForNode.length);

      expect(logsForNode).toBeTruthy();
      expect(logsForNode.length).toBeGreaterThan(10);
    });
  });
});
