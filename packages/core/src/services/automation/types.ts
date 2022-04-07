import { Types } from "mongoose";
import { ELocation } from "../../models/locations";

export interface INodeInput {
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
  location: ELocation;
  loadBalancer?: boolean;
  ip?: string;
  fqdn?: string;
}

export interface INodeLogParams {
  nodeIds: string[];
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}
