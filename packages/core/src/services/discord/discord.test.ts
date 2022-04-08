import { Service as DiscordService } from "./service";
import { NodesModel } from "../../models";
import { connect, disconnect } from "../../db";

test.skip("Discord Test", async () => {
  const discordService = new DiscordService();

  await connect();
  const testNode = await NodesModel.findOne({ backend: "algtestnet" })
    .populate("chain")
    .populate({ path: "host", populate: "location" })
    .exec();

  await discordService.addWebhookForNode(testNode);

  await disconnect();
});
