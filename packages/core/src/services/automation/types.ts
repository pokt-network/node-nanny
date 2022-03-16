import { Types } from "mongoose";

export interface INodeInput {
  chain: Types.ObjectId;
  host: Types.ObjectId;
  url: string;
  loadBalancers: Types.ObjectId[];
  port: number;
  haProxy: boolean;
  backend?: string;
  server?: string;
}

export interface INodeCsvInput {
  chain: string;
  host: string;
  url: string;
  loadBalancers: string[];
  port: number;
  haProxy: boolean;
  backend?: string;
  server?: string;
}
