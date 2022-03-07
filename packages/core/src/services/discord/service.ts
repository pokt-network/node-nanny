import { Client, Intents, CategoryChannel, Guild as Server } from "discord.js";

import { INode, WebhookModel } from "../../models";

export class Service {
  private client: Client;
  private token: string;
  private serverId: string;

  constructor() {
    this.client = new Client({
      intents: [Intents.FLAGS.GUILDS],
      rejectOnRateLimit: (error) => {
        console.error(`Discord Rate Limit Error: ${error}`);
        return true;
      },
    });
    this.token = process.env.DISCORD_TOKEN;
    this.serverId = process.env.DISCORD_SERVER_ID;
  }

  private async initServer(): Promise<Server> {
    const loggedIn = await this.client.login(this.token);
    const server = this.client.guilds.cache.get(this.serverId);
    if (!loggedIn || !server) {
      throw new Error("Unable to retrieve Discord server.");
    }
    return server;
  }

  public async addWebhookForNode({ chain, host }: INode): Promise<void> {
    const { name } = chain;
    const { location } = host;
    const categoryName = `NODE-NANNY-${location.name}`;
    const channelName = `${name}-${location.name}`.toLowerCase();

    const server = await this.initServer();
    const allChannels = await server.channels.fetch();
    const categories = allChannels.filter(({ type }) => type === "GUILD_CATEGORY");
    const channels = allChannels.filter(({ type }) => type === "GUILD_TEXT");

    const category =
      categories?.find(({ name }) => name === categoryName) ||
      (await server.channels.create(categoryName, { type: "GUILD_CATEGORY" }));

    const channelExists = channels?.some(({ name }) => name === channelName);
    if (!channelExists) {
      const channel = await server.channels.create(channelName, {
        type: "GUILD_TEXT",
        parent: category as CategoryChannel,
      });

      const { url } = await channel.createWebhook(`${channelName}-webhook`);
      await WebhookModel.create({ chain: name, location: location.name, url });
    }
  }
}
