export {
  Status as DataDogMonitorStatus,
  AlertColor,
  EventTransitions,
  EventTypes,
} from "../datadog/types";
export { Webhooks as DiscordChannel } from "../alert/types";
export { ErrorConditions as BlockChainMonitorEvents } from "../health/types";
export { Supported as SupportedBlockChains } from "../discover/types";

export enum LoadBalancerHostsInternal {
  "2A" = "ip-10-0-0-79.us-east-2.compute.internal",
  "2B" = "ip-10-0-1-208.us-east-2.compute.internal"
}


export enum LoadBalancerHostsExternal {
  SHARED_2A = "ec2-18-216-154-220.us-east-2.compute.amazonaws.com",
  SHARED_2B = "ec2-13-58-182-1.us-east-2.compute.amazonaws.com"
}


export enum Hosts {
  ETH_2A = " ip-10-0-0-162.us-east-2.compute.internal",
  ETH_2B = "ip-10-0-1-106.us-east-2.compute.internal",
  SHARED_2A = "ip-10-0-0-79.us-east-2.compute.internal",
  SHARED_2B = "ip-10-0-1-208.us-east-2.compute.internal",
}


export enum LoadBalancerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline'
}


export enum InstanceIds {
  shared_2a = 'i-0fb709e897295a622',
  shared_2b = 'i-0f61eec9ec7ecb2bc',
  bsc_2a = 'i-0b3105a7e23465369',
  bsc_2b = 'i-0355f5481fa31742c',
  eth_2a = 'i-0a05159d1539777ac',
  eth_2b = 'i-0ad7ab2f78cf8e72c',
}


