export { Webhooks as DiscordChannel } from "../alert/types";
export { EErrorConditions as BlockChainMonitorEvents } from "../health/types";
export { ESupportedBlockchains } from "../health/types";

import { IHost, INode } from "../../models";
import { HealthTypes } from "../../types";

export interface IRedisEvent extends HealthTypes.IHealthResponse {
  id: string;
  count: number;
}

export interface IRotationParams {
  backend: string;
  loadBalancers: IHost[];
  server?: string;
  manual?: boolean;
}

export interface IToggleServerParams {
  node: INode;
  title: string;
  enable: boolean;
}

export interface IRedisEventParams {
  title: string;
  message: string;
  node: INode;
  healthy: boolean;
  notSynced: boolean;
  status: HealthTypes.EErrorStatus;
  conditions: HealthTypes.EErrorConditions;
  serverCount: number;
  warningMessage?: string;
  downDispatchers?: string[];
}

export enum PocketTypes {
  PEER = "peer",
  MAIN = "main",
  DISPATCH = "dis",
  BT = "bt",
}

export enum ELoadBalancerStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  ERROR = "error",
}

export interface LoadBalancer {
  ip?: string;
  internalHostName?: string;
  externalHostName?: string;
}

export enum Limits {
  MAX_LOG = 3000,
  MAX_LOG_MSG = "Logs are too big",
}

export enum EAlertTypes {
  TRIGGER = "Triggered",
  RETRIGGER = "Retriggered",
  RESOLVED = "Resolved",
}
