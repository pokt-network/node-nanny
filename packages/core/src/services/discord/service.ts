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
        console.error(`Discord Rate Limited Error ${error}`);
        return true;
      },
    });
    this.token = process.env.DISCORD_TOKEN;
    this.serverId = process.env.DISCORD_SERVER_ID;
  }

  private async initClient(): Promise<Server> {
    await this.client.login(this.token);
    return this.client.guilds.cache.get(this.serverId);
  }

  public async addWebhookForNode({ chain, host }: INode): Promise<void> {
    const { name } = chain;
    const { location } = host;
    const catName = `NODE-NANNY-${location.name}`;
    const chanName = `${name}-${location.name}`.toLowerCase();

    const server = await this.initClient();
    const allChannels = await server.channels.fetch();
    const categories = allChannels.filter(({ type }) => type === "GUILD_CATEGORY");
    const channels = allChannels.filter(({ type }) => type === "GUILD_TEXT");

    const category =
      categories?.find(({ name }) => name === catName) ||
      (await server.channels.create(catName, { type: "GUILD_CATEGORY" }));

    const channelExists = channels?.some(({ name }) => name === chanName);
    if (!channelExists) {
      const channel = await server.channels.create(chanName, {
        type: "GUILD_TEXT",
        parent: category as CategoryChannel,
      });

      const { url } = await channel.createWebhook(`${chanName}-webhook`);
      await WebhookModel.create({ chain: name, location: location.name, url });
    }
  }
}
