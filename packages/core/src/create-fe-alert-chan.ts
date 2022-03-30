import { Service as DiscordService } from "./services/discord";

(async () => {
  try {
    await new DiscordService().addWebhookForFrontendNode();
  } catch {
    // Do nothing
  }
})();
