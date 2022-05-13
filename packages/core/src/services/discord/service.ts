import {
  CategoryChannel,
  Client,
  Intents,
  TextChannel,
  Guild as Server,
} from 'discord.js';

import { INode, IWebhook, WebhookModel } from '../../models';
import { Service as AutomationService } from '../../services/automation';
import { IServerContents } from './types';
import { wait } from '../../utils';

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
        throw error;
      },
    });
    this.token = env('DISCORD_TOKEN');
    this.serverId = env('DISCORD_SERVER_ID');
  }

  async init(): Promise<Service> {
    if (!this.server) {
      const noDiscordVars = !this.token || !this.serverId;
      if (noDiscordVars) {
        throw new Error('Discord token and/or server ID env vars are not set.');
      }

      const loggedIn = await this.client.login(this.token);
      const server = this.client.guilds.cache.get(this.serverId);
      if (!loggedIn || !server) {
        throw new Error('Unable to retrieve Discord server.');
      }
      this.server = server;
    }

    return this;
  }

  async logout() {
    await new Promise<void>((res) => {
      this.client.destroy();
      setTimeout(() => res(), 500);
    });
  }

  async createWebhooks(nodes: INode[], batch = false): Promise<IWebhook[]> {
    const createdWebhooks: IWebhook[] = [];

    /* Discord imposes a rate limit on webhook creation so the loop waits on each
    rate limit error until all new node's channels and webhooks have been created */
    let index = 0;
    while (index <= nodes.length - 1) {
      try {
        const webhook = await this.addWebhookForNode(nodes[index], true);
        if (webhook) createdWebhooks.push(webhook);
        index++;
      } catch (error) {
        if (error?.timeout) {
          const waitPeriod = error.timeout + 1000;
          await wait(waitPeriod);
        } else {
          throw error;
        }
      }
    }

    /* Restart monitor to begin monitoring newly created nodes */
    if (batch) await new AutomationService().restartMonitor();

    return createdWebhooks;
  }

  private async addWebhookForNode(
    { chain, host }: INode,
    batch = false,
  ): Promise<IWebhook> {
    try {
      const { name } = chain;
      const {
        location: { name: location },
      } = host;
      if (await WebhookModel.exists({ chain: name, location })) {
        return;
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
        return await this.createWebhookForChannel(channelName, channel, name, location);
      }
    } catch (error) {
      if (batch && error?.timeout) {
        throw error;
      } else {
        throw new Error(`Discord webhook creation error: ${JSON.stringify(error)}`);
      }
    }
  }

  async addWebhookForFrontendNodes(): Promise<void> {
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
  ): Promise<IWebhook> {
    const { url } = await channel.createWebhook(`${channelName}-alert`);
    return await WebhookModel.create({ chain, location, url });
  }

  /** DO NOT USE - Will Delete ALL Channels in Server; for testing purposes only. - DO NOT USE */
  private async clearChannels(): Promise<void> {
    const allChannels = await this.server.channels.fetch();
    for await (const [, channel] of allChannels) {
      await channel.delete();
    }
  }
}
