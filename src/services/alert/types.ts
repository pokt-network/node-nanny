export enum AlertChannel {
  DISCORD = "discord",
  PAGER_DUTY = "pd",
  BOTH = "both",
}
 
export enum DiscordDetails {
  WEBHOOK_URL = "***REMOVED***",
}

export enum PagerDutyDetails {
  BODY_TYPE = "incident_body",
  FROM = "john@pokt.network",
  SERVICE_ID = "PASFNRN",
  SERVICE_TYPE = "service_reference",
  TYPE = "incident",
}

export enum IncidentLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum Titles {
  OFFLINE = "Node is offline",
  UNSYNCHRONIZED = "Node is not synched",
  MONITOR_ERROR = "Node monitor has encountered an issue",
}

export enum Messages {

}
