import {
  CategoryChannel,
  Client,
  Intents,
  TextChannel,
  Guild as Server,
} from 'discord.js';

import { INode, WebhookModel } from '../../models';
import { IServerContents } from './types';

import env from '../../environment';

export class Service {
  private client: Client;
  private token: string;
  private serverId: string;

  private server: Server;

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

  public async init(): Promise<Service> {
    if (!this.server) {
      const loggedIn = await this.client.login(this.token);
      const server = this.client.guilds.cache.get(this.serverId);
      if (!loggedIn || !server) {
        throw new Error('Unable to retrieve Discord server.');
      }
      this.server = server;
    }
    return this;
  }

  public async logout() {
    await this.client.destroy();
  }

  public async addWebhookForNode({ chain, host }: INode): Promise<void> {
    try {
      const { name } = chain;
      const {
        location: { name: location },
      } = host;

      const noDiscordVars = !this.token || !this.serverId;
      const webhookExists = await WebhookModel.exists({ chain: name, location });
      if (noDiscordVars) {
        throw new Error('Discord token and/or server ID are not set.');
      }

      const categoryName = `NODE-NANNY-${location}`;
      const channelName = `${name}-${location}`.toLowerCase();

      const { categories, channels } = await this.getServerChannels();
      const category = await this.getOrCreateCategory(categoryName, categories);
      const channel = await this.createChannelIfDoesntExist(
        channelName,
        category,
        channels,
      );
      if (channel) {
        await this.createWebhookForChannel(channelName, channel, name, location);
      }
    } catch (error) {
      throw new Error(`Discord webhook creation error: ${error.message}`);
    }
  }

  public async addWebhookForFrontendNodes(): Promise<void> {
    try {
      const categoryName = 'NODE-NANNY-FRONTEND-ALERT';
      const channelName = 'frontend-alert';

      const { categories, channels } = await this.getServerChannels();
      const category = await this.getOrCreateCategory(categoryName, categories);
      const channel = await this.createChannelIfDoesntExist(
        channelName,
        category,
        channels,
      );
      if (channel) {
        await this.createWebhookForChannel(channelName, channel, 'FRONTEND_ALERT', 'n/a');
      }
    } catch (error) {
      throw new Error(`Discord frontend webhook creation error: ${error.message}`);
    }
  }

  private async getServerChannels(): Promise<IServerContents> {
    const allChannels = await this.server.channels.fetch();

    const categories = allChannels.filter(
      ({ type }) => type === 'GUILD_CATEGORY',
    ) as IServerContents['categories'];
    const channels = allChannels.filter(
      ({ type }) => type === 'GUILD_TEXT',
    ) as IServerContents['channels'];

    return { categories, channels };
  }

  private async getOrCreateCategory(
    categoryName: string,
    categories: IServerContents['categories'],
  ): Promise<CategoryChannel> {
    return (
      categories?.find(({ name }) => name === categoryName) ||
      (await this.server.channels.create(categoryName, { type: 'GUILD_CATEGORY' }))
    );
  }

  private async createChannelIfDoesntExist(
    channelName: string,
    category: CategoryChannel,
    channels: IServerContents['channels'],
  ): Promise<TextChannel> {
    const channelExists = channels?.some(({ name }) => name === channelName);
    if (!channelExists) {
      return await this.server.channels.create(channelName, {
        type: 'GUILD_TEXT',
        parent: category,
      });
    }
  }

  private async createWebhookForChannel(
    channelName: string,
    channel: TextChannel,
    chain: string,
    location: string,
  ) {
    const { url } = await channel.createWebhook(`${channelName}-alert`);
    await WebhookModel.create({ chain, location, url });
  }

  /** DO NOT USE - Will Delete ALL Channels in Server - DO NOT USE */
  private async clearChannels(): Promise<void> {
    const allChannels = await this.server.channels.fetch();
    for await (const [, channel] of allChannels) {
      await channel.delete();
    }
  }
}
