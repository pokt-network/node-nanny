import {
  CategoryChannel,
  Client,
  Collection,
  Intents,
  NonThreadGuildBasedChannel,
  TextChannel,
  Guild as Server,
} from 'discord.js';

import { IWebhook, WebhookModel } from '../../models';
import { Service as AutomationService } from '../../services/automation';
import { ICreateWebhookParams, ICreateWebhooksParams, IServerContents } from './types';
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

  async createWebhooks(
    { nodes, batch = false }: ICreateWebhooksParams,
    test = false,
  ): Promise<IWebhook[]> {
    const createdWebhooks: IWebhook[] = [];

    /* Discord imposes a rate limit on webhook creation so the loop waits on each
    rate limit error until all new node's channels and webhooks have been created */
    let index = 0;
    while (index <= nodes.length - 1) {
      try {
        const webhook = await this.addWebhookForNode({ node: nodes[index], batch }, test);
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
    if (!test) await this.logout();

    return createdWebhooks;
  }

  private async addWebhookForNode(
    { node, batch }: ICreateWebhookParams,
    test = false,
  ): Promise<IWebhook> {
    try {
      const { chain, host } = node;
      const { location } = host;
      const { name: chainName } = chain;
      const { name: locName } = location;

      if (await WebhookModel.exists({ chain: chainName, location: locName })) {
        return;
      }

      const categoryName = `${test ? 'TEST-' : ''}NODE-NANNY-${locName}`;
      const channelName = `${test ? 'test-' : ''}${chainName}-${locName}`.toLowerCase();

      const { categories, channels } = await this.getServerChannels();
      const category = await this.getOrCreateCategory(categoryName, categories);
      const channel = await this.getOrCreateChannel(channelName, category, channels);

      return await this.createWebhookForChannel(channelName, channel, chainName, locName);
    } catch (error) {
      if (batch && error?.timeout) {
        throw error;
      } else {
        throw new Error(`Discord webhook creation error: ${JSON.stringify(error)}`);
      }
    }
  }

  async addWebhookForFrontendNodes(): Promise<IWebhook> {
    try {
      const categoryName = 'NODE-NANNY-FRONTEND-ALERT';
      const channelName = 'frontend-alert';

      const { categories, channels } = await this.getServerChannels();
      const category = await this.getOrCreateCategory(categoryName, categories);
      const channel = await this.getOrCreateChannel(channelName, category, channels);
      return await this.createWebhookForChannel(
        channelName,
        channel,
        'FRONTEND_ALERT',
        'n/a',
      );
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

  private async getOrCreateChannel(
    channelName: string,
    category: CategoryChannel,
    channels: IServerContents['channels'],
  ): Promise<TextChannel> {
    return (
      channels?.find(({ name }) => name === channelName) ||
      (await this.server.channels.create(channelName, {
        parent: category,
        type: 'GUILD_TEXT',
      }))
    );
  }

  private async createWebhookForChannel(
    channelName: string,
    channel: TextChannel,
    chain: string,
    location: string,
  ): Promise<any> {
    const webhookName = `${channelName}-alert`;
    const webhooks = await channel.fetchWebhooks();

    const { url } =
      webhooks?.find(({ name }) => name === webhookName) ||
      (await channel.createWebhook(webhookName));

    return WebhookModel.create({ chain, location, url });
  }

  /** DO NOT USE - For testing purposes only - DO NOT USE */
  async clearChannelsForTest(): Promise<void> {
    let allChannels: Collection<string, NonThreadGuildBasedChannel>;

    while (!allChannels) {
      try {
        allChannels = await this.server.channels.fetch();
      } catch (error) {
        if (error?.timeout) {
          const waitPeriod = error.timeout + 1000;
          await wait(waitPeriod);
        } else {
          throw error;
        }
      }
    }
    const testChannels = allChannels.filter(({ name }) =>
      name.toUpperCase().includes('TEST-'),
    );

    for await (const [, channel] of testChannels) {
      await channel.delete();
    }
  }
}
