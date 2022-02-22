import { config } from "dotenv";
import { connect, disconnect } from "./index";
import { WebhookModel, ChainsModel } from "../models";

config();

(async () => {
  await connect();

  const webhooks = await WebhookModel.find({});

  // console.log({ webhooks });

  for await (const { _id, chain } of webhooks as any) {
    const chainForWebhook = await ChainsModel.find({ name: chain });

    // console.log({ chainForWebhook });
    // if (!chainForWebhook?.length) console.log("NOT FOUND FOR CHAIN", chain);
    // if (chainForWebhook?.length > 1) console.log("MULTIPLE CHAINS FOUND FOR CHAIN", chain);

    if (chainForWebhook?.length && chainForWebhook.length === 1) {
      const chainId = (chainForWebhook[0] as any)._id;
      await WebhookModel.updateOne({ _id }, { chain: chainId });
    } else if (!chainForWebhook?.length) {
      await WebhookModel.updateOne({ _id }, { chain: null });
    }
  }

  await disconnect();
})();
