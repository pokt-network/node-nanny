import { Service as DiscordService } from "./services/discord";

(async () => {
  const discordService = new DiscordService();

  await discordService.clearChannels();
})();
