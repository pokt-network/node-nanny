import { Client, Intents, CategoryChannel, Guild as Server } from 'discord.js';

import { INode, WebhookModel } from '../../models';

import env from '../../environment';

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
    this.token = env('DISCORD_TOKEN');
    this.serverId = env('DISCORD_SERVER_ID');
  }

  private async initServer(): Promise<Server> {
    const loggedIn = await this.client.login(this.token);
    const server = this.client.guilds.cache.get(this.serverId);
    if (!loggedIn || !server) {
      throw new Error('Unable to retrieve Discord server.');
    }
    return server;
  }

  public async addWebhookForNode({ chain, host }: INode): Promise<void> {
    try {
      const { name } = chain;
      const {
        location: { name: location },
      } = host;

      const noDiscordVars = !this.token || !this.serverId;
      const webhookExists = await WebhookModel.exists({ chain: name, location });
      if (noDiscordVars || webhookExists) {
        return;
      }

      const categoryName = `NODE-NANNY-${location}`;
      const channelName = `${name}-${location}`.toLowerCase();

      const server = await this.initServer();
      const allChannels = await server.channels.fetch();
      const categories = allChannels.filter(({ type }) => type === 'GUILD_CATEGORY');
      const channels = allChannels.filter(({ type }) => type === 'GUILD_TEXT');

      const category =
        categories?.find(({ name }) => name === categoryName) ||
        (await server.channels.create(categoryName, { type: 'GUILD_CATEGORY' }));

      const channelExists = channels?.some(({ name }) => name === channelName);
      if (!channelExists) {
        const channel = await server.channels.create(channelName, {
          type: 'GUILD_TEXT',
          parent: category as CategoryChannel,
        });

        const { url } = await channel.createWebhook(`${channelName}-alert`);
        await WebhookModel.create({ chain: name, location, url });
      }
    } catch (error) {
      throw new Error(`Discord webhook creation error: ${error.message}`);
    }
  }

  public async addWebhookForFrontendNodes(): Promise<void> {
    const categoryName = 'NODE-NANNY-FRONTEND-ALERT';
    const channelName = 'frontend-alert';

    const server = await this.initServer();
    const allChannels = await server.channels.fetch();
    const categories = allChannels.filter(({ type }) => type === 'GUILD_CATEGORY');
    const channels = allChannels.filter(({ type }) => type === 'GUILD_TEXT');

    const category =
      categories?.find(({ name }) => name === categoryName) ||
      (await server.channels.create(categoryName, { type: 'GUILD_CATEGORY' }));

    const channelExists = channels?.some(({ name }) => name === channelName);
    if (!channelExists) {
      const channel = await server.channels.create(channelName, {
        type: 'GUILD_TEXT',
        parent: category as CategoryChannel,
      });

      const { url } = await channel.createWebhook(`${channelName}-alert`);
      if (!(await WebhookModel.exists({ chain: 'FRONTEND_ALERT' }))) {
        await WebhookModel.create({ chain: 'FRONTEND_ALERT', location: 'n/a', url });
      }
    }
  }

  public async clearChannels() {
    const server = await this.initServer();
    const allChannels = await server.channels.fetch();
    for await (const [, channel] of allChannels) {
      await channel.delete();
    }
  }
}
