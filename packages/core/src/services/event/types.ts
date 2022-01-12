export {
  Status as DataDogMonitorStatus,
  AlertColor,
  EventTransitions,
  EventTypes,
} from "../datadog/types";
export { Webhooks as DiscordChannel } from "../alert/types";
export { ErrorConditions as BlockChainMonitorEvents } from "../health/types";
export { SupportedBlockChains } from "../health/types";

export enum PocketTypes {
  PEER = "peer",
  MAIN = "main",
  DISPATCH = "dis",
  BT = "bt",
}

export enum LoadBalancerStatus {
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
