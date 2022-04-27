import mongoose from "mongoose";
import { ILog, LogsModel } from "../../models";
import { Service } from "./service";

const logService = new Service();
let logs: ILog[];

const mockId = "6244d6843e984hff093rjfihf2f6";
const numOfLogs = 800;

const createMocks = async () => {
  let index = 0;
  const logs = [];
  for await (const _log of [...Array(numOfLogs)]) {
    index++;
    const mockLog = {
      timestamp: new Date().toISOString(),
      label: mockId,
      level: index % 3 !== 0 ? "info" : "error",
      message:
        '{"name":"shared-2a/TST/tst1/2a","conditions":"HEALTHY","status":"OK","healthy":true"}',
    };
    logs.push(await LogsModel.create(mockLog));
  }
  return logs;
};

beforeAll(async () => {
  await mongoose.connect(
    "mongodb://root:rootpassword@localhost:27017/dev-node-nanny?authSource=admin",
  );
  // await mongoose.connect(global.__MONGO_URI__);
  logs = await createMocks();
});

afterAll(async () => {
  // await LogsModel.deleteMany({});
  await mongoose.disconnect();
});

// describe("Log Service Tests", () => {
//   describe("Get Logs Tests", () => {
//     test("Should fetch paginated logs for a specific Node without timestamp query", async () => {
//       const logsForNode = await logService.getLogsForNodes({
//         nodeIds: [mockId],
//         page: 1,
//         limit: 100,
//       });

//       expect(logsForNode).toBeTruthy();
//       expect(logsForNode.docs.length).toEqual(numOfLogs);
//       expect(logsForNode.docs.filter(({ level }) => level === "info").length).toEqual(56);
//       expect(logsForNode.docs.filter(({ level }) => level === "error").length).toEqual(
//         27,
//       );
//     });

//     test("Should fetch paginated logs for a specific Node with timestamps", async () => {
//       const logsForNode = await logService.getLogsForNodes({
//         nodeIds: [mockId],
//         startDate: new Date(Date.now() - 1000 * 60).toISOString(),
//         endDate: new Date().toISOString(),
//         page: 1,
//         limit: 100,
//       });

//       expect(logsForNode).toBeTruthy();
//       expect(logsForNode.docs.length).toEqual(numOfLogs);
//       expect(logsForNode.docs.filter(({ level }) => level === "info").length).toEqual(56);
//       expect(logsForNode.docs.filter(({ level }) => level === "error").length).toEqual(
//         27,
//       );
//     });
//   });

describe.only("Get Logs for Charts Tests", () => {
  test.only("Should fetch log data in a specified increment for a specified time range and for all nodes if no nodeIds set", async () => {
    console.time("Get Logs for all Nodes");
    console.log({
      startDate: new Date(Date.now() - 15 * 1000 * 60).toISOString(),
      endDate: new Date().toISOString(),
      increment: 1000 * 60,
    });
    const logData = await logService.getLogsForChart({
      startDate: new Date(Date.now() - 15 * 1000 * 60).toISOString(),
      endDate: new Date().toISOString(),
      increment: 1000 * 60,
    });
    console.timeEnd("Get Logs for all Nodes");
    console.log("Fetched", logData.length, "Logs");
    expect(logData).toBeTruthy();

    // expect(logData[0].ok).toEqual(534);
    // expect(logData[0].error).toEqual(266);
    // expect(logData[0].ok + logData[0].error).toEqual(numOfLogs);
  });

  // test("Should fetch log data in a specified increment for a specified time range and for a specific set of nodes if nodeIds set", async () => {
  //   console.time("Get Logs for some Nodes");
  //   const logData = await logService.getLogsForChart({
  //     startDate: new Date(Date.now() - 1000 * 60).toISOString(),
  //     endDate: new Date().toISOString(),
  //     increment: 1000 * 60,
  //     nodeIds: [mockId],
  //   });
  //   console.timeEnd("Get Logs for some Nodes");

  //   expect(logData[0].ok).toEqual(534);
  //   expect(logData[0].error).toEqual(266);
  //   expect(logData[0].ok + logData[0].error).toEqual(numOfLogs);
  // });
  // });
});
