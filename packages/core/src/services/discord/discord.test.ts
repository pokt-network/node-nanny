import mongoose from 'mongoose';
import { Collection, NonThreadGuildBasedChannel, CategoryChannel } from 'discord.js';

import { Service as DiscordService } from './service';
import { INode, WebhookModel } from '../../models';

let discordService: DiscordService;

const testNodes = ([
  { chain: { name: 'POLTST' }, host: { location: { name: 'USE2' } } },
  { chain: { name: 'POKT' }, host: { location: { name: 'APNE1' } } },
  { chain: { name: 'ALGTST' }, host: { location: { name: 'CACE1' } } },
  { chain: { name: 'FTM' }, host: { location: { name: 'USE1' } } },
] as unknown) as INode[];

const testCategory = 'TEST_CATEGORY';

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
  process.env.DISCORD_TOKEN = process.env.TEST_DISCORD_TOKEN;
  process.env.DISCORD_SERVER_ID = process.env.TEST_DISCORD_SERVER_ID;

  discordService = await new DiscordService().init();
  await discordService['clearChannels']();

  const category = await discordService['getOrCreateCategory'](
    testCategory,
    new Collection<string, CategoryChannel>(),
  );
  for await (const { chain, host } of testNodes) {
    const { name } = chain;
    const {
      location: { name: location },
    } = host;
    const channelName = `TEST-${name}-${location}`.toLowerCase();
    await discordService['createChannelIfDoesntExist'](
      channelName,
      category,
      new Collection<string, NonThreadGuildBasedChannel>(),
    );
  }
});

afterAll(async () => {
  await discordService.logout();
  await mongoose.disconnect();
});

describe('Discord Tests', () => {
  describe('getServerChannels', () => {
    test('should fetch channels from Discord server', async () => {
      const { categories, channels } = await discordService['getServerChannels']();

      expect(categories.size).toEqual(1);
      expect(channels.size).toEqual(4);
    });
  });

  describe('getOrCreateCategory', () => {
    test('should return an existing category if it already exists', async () => {
      const { categories } = await discordService['getServerChannels']();

      const category = await discordService['getOrCreateCategory'](
        testCategory,
        categories,
      );

      expect(categories.has(category.id)).toEqual(true);
    });

    test("should create and return a new category if it doesn't exist", async () => {
      const { categories } = await discordService['getServerChannels']();

      const category = await discordService['getOrCreateCategory'](
        'TEST_NEW_CATEGORY',
        categories,
      );

      const { categories: categoriesAfter } = await discordService['getServerChannels']();

      expect(categories.has(category.id)).toEqual(false);
      expect(categoriesAfter.has(category.id)).toEqual(true);
    });
  });

  describe('createChannelIfDoesntExist', () => {
    test("should return a new channel if it doesn't exist", async () => {
      const { categories, channels } = await discordService['getServerChannels']();
      const category = await discordService['getOrCreateCategory'](
        testCategory,
        categories,
      );

      const newChannelName = 'test-hmy0-use2';

      const channel = await discordService['createChannelIfDoesntExist'](
        newChannelName,
        category,
        channels,
      );

      const { channels: channelsAfter } = await discordService['getServerChannels']();

      expect(channel).toBeTruthy();
      expect(channels.has(channel.id)).toEqual(false);
      expect(channelsAfter.has(channel.id)).toEqual(true);
    });

    test('should return undefined if channel already exists', async () => {
      const { categories, channels } = await discordService['getServerChannels']();
      const category = await discordService['getOrCreateCategory'](
        testCategory,
        categories,
      );

      const newChannelName = 'test-poltst-use2';

      const channel = await discordService['createChannelIfDoesntExist'](
        newChannelName,
        category,
        channels,
      );

      const { channels: channelsAfter } = await discordService['getServerChannels']();

      expect(channel).toBeFalsy();
      expect(channels.size).toEqual(channelsAfter.size);
    });
  });

  // describe('Channel creation Tests', async () => {
  //   test('should create one single channel', async () => {
  //     await connect();
  //     const testNode = await NodesModel.findOne({ backend: 'algtestnet' })
  //       .populate('chain')
  //       .populate({ path: 'host', populate: 'location' })
  //       .exec();

  //     await discordService.addWebhookForNode(testNode);

  //     await disconnect();
  //   });
  // });
});
