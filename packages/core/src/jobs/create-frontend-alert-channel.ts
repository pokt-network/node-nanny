import { WebhookModel } from "../models";
import { DiscordService } from "../services";

/* ----- Script Runs when monitor starts ----- */
export const createFrontendAlertChannel = async () => {
  /* ----- Add Frontend Alert Webhook if Doesn't Exist ---- */
  if (!(await WebhookModel.exists({ chain: "FRONTEND_ALERT" }))) {
    try {
      await new DiscordService().addWebhookForFrontendNodes();
      console.log(`Frontend alert channel successfully created.`);
    } catch (error) {
      console.log(`Unable to create frontend alert channel. ${error}`);
    }
  }
};
