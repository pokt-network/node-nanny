import { Client, Intents, CategoryChannel, TextChannel } from "discord.js";

import { connect, disconnect } from "../db";
import { ChainsModel, WebhookModel, LocationsModel } from "../models";
import { wait } from "../utils";

const createDiscordChannels = async (server: string) => {
  await connect();
  var guild = server;
  const chains = await ChainsModel.find({});
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
    rejectOnRateLimit: (data) => {
      console.log({ data });
      return true;
    },
  });
  const locations = (await LocationsModel.find({})).map(({ name }) => name);

  client.once("ready", async () => {
    console.log("🤘 Discord client ready. Running script ...");

    const server = client.guilds.cache.get(guild);
    console.log(`🔥 Fetched server ${server.name} ...`);

    // // TEMP DELETE CHANNELS CODE
    // const channels = await server.channels.fetch();
    // for await (const [, channel] of channels) {
    //   const DELETED = await channel.delete();
    //   console.log({ DELETED });
    // }

    let numOfCategories = 0;
    let numOfChannels = 0;
    for await (const location of locations) {
      const categoryName = `NodeNanny-${location}`;
      const category = await server.channels.create(categoryName, {
        type: "GUILD_CATEGORY",
      });
      numOfCategories++;
      console.log(`📖 Created Category ${category.name} ...`);

      for await (const { name } of chains) {
        const channelName = `${name}-${location}`;
        const channel = await server.channels.create(channelName, {
          type: "GUILD_TEXT",
          parent: category,
        });
        numOfChannels++;
        console.log(`📻 Created channel ${channel.name} ...`);

        const { url } = await channel.createWebhook(`${channelName}-webhook`);
        await WebhookModel.create({ chain: name, location, url });
        console.log(`🌐 Created webhook ...`);
      }

      console.log(
        `✅ Finished creating channels for category ${category.name}.\nWaiting 65 seconds to avoid Discord rate limit ...`,
      );
      await wait(65000); // Avoid rate limit from Discord
    }

    console.log(
      `✨ Finished creating all: ${numOfCategories} categories and ${numOfChannels} channels/webhooks.`,
    );
    await disconnect();
  });

  client.login(process.env.DISCORD_TOKEN);
};

createDiscordChannels(process.env.DISCORD_SERVER_ID);
