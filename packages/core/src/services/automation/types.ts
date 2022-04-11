import { Types } from "mongoose";

export interface INodeInput {
  https: boolean;
  chain: Types.ObjectId;
  host: Types.ObjectId;
  name: string;
  loadBalancers: Types.ObjectId[];
  port: number;
  haProxy: boolean;
  backend?: string;
  frontend?: string;
  server?: string;
}

export interface INodeCsvInput {
  https: string;
  chain: string;
  host: string;
  name: string;
  loadBalancers: string[];
  port: number;
  haProxy: boolean;
  backend?: string;
  server?: string;
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
  chain?: string;
  host?: string;
  name?: string;
  loadBalancers?: string[];
  port?: number;
  haProxy?: boolean;
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
