import { Types } from "mongoose";

export interface INodeInput {
  https: boolean;
  chain: Types.ObjectId;
  host: Types.ObjectId;
  name: string;
  url: string;
  loadBalancers: Types.ObjectId[];
  port: number;
  automation: boolean;
  backend?: string;
  frontend?: string;
  server?: string;
  basicAuth?: string;
}

export interface INodeCsvInput {
  https: string;
  chain: string;
  host: string;
  name: string;
  loadBalancers: string[];
  port: number;
  automation: boolean;
  backend?: string;
  frontend?: string;
  server?: string;
  basicAuth?: string;
}

export interface IHostInput {
  name: string;
  location: Types.ObjectId;
  loadBalancer: boolean;
  ip?: string;
  fqdn?: string;
}

export interface IHostCsvInput {
  name: string;
  location: string;
  loadBalancer?: boolean;
  ip?: string;
  fqdn?: string;
}

export interface INodeUpdate {
  id: string;
  https?: boolean;
  chain?: string;
  host?: string;
  name?: string;
  url?: string;
  loadBalancers?: string[];
  port?: number;
  automation?: boolean;
  backend?: string;
  frontend?: string;
  server?: string;
}

export interface IHostUpdate {
  id: string;
  name?: string;
  location?: string;
  loadBalancer?: boolean;
  ip?: string;
  fqdn?: string;
}
