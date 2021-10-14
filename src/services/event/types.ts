export {
  Status as DataDogMonitorStatus,
  AlertColor,
  EventTransitions,
  EventTypes,
} from "../datadog/types";
export { Webhooks as DiscordChannel } from "../alert/types";
export { ErrorConditions as BlockChainMonitorEvents } from "../health/types";
export { Supported as SupportedBlockChains } from "../discover/types"

export enum LoadBalancerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline'
}


export interface LoadBalancer {
  internalHostName: string
  externalHostName: string
}

export enum Limits {
  MAX_LOG = 3000,
  MAX_LOG_MSG = 'Logs are too big'
}
