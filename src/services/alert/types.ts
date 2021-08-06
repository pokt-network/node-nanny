export enum AlertChannel {
  DISCORD = "discord",
  PAGER_DUTY = "pd",
  BOTH = "both",
}
 
export enum DiscordDetails {
  WEBHOOK_URL = "***REMOVED***",
  WEBHOOK_TEST= "***REMOVED***"
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
  NOT_SYNCHRONIZED = "Node is not synched",
  MONITOR_ERROR = "Node monitor has encountered an issue",
}

export enum DataDogAlertColor {
  ERROR = 15548997,
  SUCCESS = 3066993,
  WARNING = 16776960,
}

export enum LinkTitles {
  MONITOR = "Monitor Status",
  LOGS = "Related Logs",
}
