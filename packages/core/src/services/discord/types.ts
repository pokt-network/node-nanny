import { CategoryChannel, Collection, NonThreadGuildBasedChannel } from 'discord.js';

export interface IServerContents {
  categories: Collection<string, CategoryChannel>;
  channels: Collection<string, NonThreadGuildBasedChannel>;
}
