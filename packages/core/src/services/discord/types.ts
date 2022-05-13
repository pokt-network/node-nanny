import { CategoryChannel, Collection, TextChannel } from 'discord.js';
import { INode } from '../../models';

export interface IServerContents {
  categories: Collection<string, CategoryChannel>;
  channels: Collection<string, TextChannel>;
}

export interface ICreateWebhooksParams {
  nodes: INode[];
  batch: boolean;
}

export interface ICreateWebhookParams {
  node: INode;
  batch: boolean;
}
