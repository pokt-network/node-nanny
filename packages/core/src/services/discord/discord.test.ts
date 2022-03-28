import { Service as DiscordService } from "./service";
import { NodesModel } from "../../models";
import { connect, disconnect } from "../../db";

jest.setTimeout(30000);

test("Discord Test", async () => {
  const discordService = new DiscordService();

  await connect();
  const testNode = await NodesModel.findOne({ backend: "algtestnet" })
    .populate("chain")
    .populate({ path: "host", populate: "location" })
    .exec();

  console.log("FETCHED NODE", { testNode, location: testNode.host.location });

  await discordService.addWebhookForNode(testNode);

  await disconnect();
});
