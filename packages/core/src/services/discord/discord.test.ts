import mongoose from 'mongoose';
import { Collection, TextChannel, CategoryChannel } from 'discord.js';

import { Service as DiscordService } from './service';
import { INode, WebhookModel } from '../../models';
import { wait } from '../../utils';
import { IServerContents } from './types';

let discordService: DiscordService;

const testCategory = 'TEST_CATEGORY';

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
  process.env.DISCORD_TOKEN = process.env.TEST_DISCORD_TOKEN;
  process.env.DISCORD_SERVER_ID = process.env.TEST_DISCORD_SERVER_ID;

  discordService = await new DiscordService().init();
  await discordService.clearChannelsForTest();
});

afterAll(async () => {
  await discordService.clearChannelsForTest();
  await discordService.logout();
  await mongoose.disconnect();
});

describe('Discord Service Tests', () => {
  describe('createWebhooks', () => {
    test('should create a channel and webhook for new chain/location combination', async () => {
      const [testNewNode] = testNodesBatch;
      const chain = testNewNode.chain.name;
      const location = testNewNode.host.location.name;
      const existsBefore = await WebhookModel.exists({ chain, location });

      const [webhook] = await discordService.createWebhooks(
        { nodes: [testNewNode], batch: false },
        true,
      ); // Method Call

      const { categories, channels } = await discordService['getServerChannels']();
      const categoryName = `TEST_NODE-NANNY-${location}`;
      const channelName = `test-${chain}-${location}`.toLowerCase();
      const newCategory = categories.find(({ name }) => name === categoryName);
      const newChannel = channels.find(({ name }) => name === channelName);

      const existsAfter = await WebhookModel.exists({ chain, location });

      expect(newCategory).toBeTruthy();
      expect(newChannel).toBeTruthy();
      expect(existsBefore).toBeFalsy();
      expect(webhook.chain).toBeTruthy();
      expect(typeof webhook.url).toEqual('string');
      expect(existsAfter).toBeTruthy();
    });

    test('should create a webhook for every chain/location combo for all nodes created in a CSV batch upload', async () => {
      await discordService.createWebhooks({ nodes: testNodesBatch, batch: true }, true); // Method Call

      const { categories, channels } = await discordService['getServerChannels']();

      const webhooks = await WebhookModel.find({});
      const numOfDuplicates = webhooks
        .map(({ chain, location }) => `${chain}/${location}`)
        .reduce((list, item, index, array) => {
          if (array.indexOf(item, index + 1) !== -1 && list.indexOf(item) === -1) {
            list.push(item);
          }
          return list;
        }, []).length;

      expect(categories.size).toEqual(3);
      expect(channels.size).toEqual(8);
      expect(webhooks.length).toEqual(8);
      expect(numOfDuplicates).toEqual(0);
    });
  });

  /* Private Methods */
  describe('Testing the individual private class methods', () => {
    let categories: IServerContents['categories'], channels: IServerContents['channels'];

    beforeAll(async () => {
      await discordService.clearChannelsForTest();
      await WebhookModel.deleteMany({});
      /* Test setup */
      const category = await discordService['getOrCreateCategory'](
        testCategory,
        new Collection<string, CategoryChannel>(),
      );
      for await (const { chain, host } of testNodes) {
        const { name } = chain;
        const { location } = host;
        const channelName = `TEST-${name}-${location.name}`.toLowerCase();
        await discordService['createChannelIfDoesntExist'](
          channelName,
          category,
          new Collection<string, TextChannel>(),
        );
      }
      ({ categories, channels } = await discordService['getServerChannels']());
    });

    describe('getServerChannels', () => {
      test('should fetch channels from Discord server', async () => {
        expect(categories.size).toEqual(1);
        expect(channels.size).toEqual(4);
      });
    });

    describe('getOrCreateCategory', () => {
      test('should return an existing category if it already exists', async () => {
        const category = await discordService['getOrCreateCategory'](
          testCategory, // Method Call
          categories,
        );

        expect(categories.has(category.id)).toEqual(true);
      });

      test("should create and return a new category if it doesn't exist", async () => {
        const category = await discordService['getOrCreateCategory'](
          'TEST_NEW_CATEGORY', // Method Call
          categories,
        );

        const { categories: categoriesAfter } = await discordService[
          'getServerChannels'
        ]();
        expect(categories.has(category.id)).toEqual(false);
        expect(categoriesAfter.has(category.id)).toEqual(true);
      });
    });

    describe('createChannelIfDoesntExist', () => {
      test('should return undefined if channel already exists', async () => {
        const category = await discordService['getOrCreateCategory'](
          testCategory,
          categories,
        );
        const existingChannelName = 'test-poltst-use2';

        const channel = await discordService['createChannelIfDoesntExist'](
          existingChannelName, // Method Call
          category,
          channels,
        );

        const { channels: channelsAfter } = await discordService['getServerChannels']();

        expect(channel).toBeFalsy();
        expect(channels.size).toEqual(channelsAfter.size);
      });

      test("should return a new channel if it doesn't exist", async () => {
        const category = await discordService['getOrCreateCategory'](
          testCategory,
          categories,
        );
        const newChannelName = 'test-hmy0-use2';

        const channel = await discordService['createChannelIfDoesntExist'](
          newChannelName, // Method Call
          category,
          channels,
        );

        const { channels: channelsAfter } = await discordService['getServerChannels']();
        expect(channel).toBeTruthy();
        expect(channels.has(channel.id)).toEqual(false);
        expect(channelsAfter.has(channel.id)).toEqual(true);
      });
    });
  });
});

/* Mock Data */
const testNodes = ([
  { chain: { name: 'POLTST' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'POKT' }, host: { location: { name: 'APNE1' } } },
  { chain: { name: 'ALGTST' }, host: { location: { name: 'CACE1' } } },
  { chain: { name: 'FTM' }, host: { location: { name: 'USE1' } } },
] as unknown) as INode[];

const testNodesBatch = ([
  { chain: { name: 'FUS' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'POKT' }, host: { location: { name: 'USE1' } } },
  { chain: { name: 'AVA' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'AVATST' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'XDAI' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'XDAI' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'ETH' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'ETH' }, host: { location: { name: 'CACE1' } } },
  { chain: { name: 'OEC' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'OEC' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'OEC' }, host: { location: { name: 'USE2' } } },
] as unknown) as INode[];
