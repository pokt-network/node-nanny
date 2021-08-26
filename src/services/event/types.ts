export { Status as DataDogMonitorStatus, AlertColor } from "../datadog/types";
export { Webhooks as DiscordChannel } from "../alert/types";
export { ErrorConditions as BlockChainMonitorEvents } from "../health/types";
export { Supported as SupportedBlockChains } from "../discover/types";

export enum LoadBalancerHosts {
  "2A" = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-0-149.us-east-2.compute.internal"
  "2B" = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-1-208.us-east-2.compute.internal",
}

export enum Hosts {
  ETH_2A = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-0-162.us-east-2.compute.internal",
  ETH_2B = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-1-106.us-east-2.compute.internal",
  SHARED_2A = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-0-149.us-east-2.compute.internal",
  SHARED_2B = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-1-208.us-east-2.compute.internal",
}

export enum EventTransitions {
  TRIGGERED = "Triggered",
  RECOVERED = "Recovered",
}

export enum EventTypes {
  ERROR = "error",
  SUCCESS = "success",
}
