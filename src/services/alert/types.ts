export enum AlertChannel {
  DISCORD = "discord",
  PAGER_DUTY = "pd",
  BOTH = "both",
}
 
export enum DiscordDetails {
  WEBHOOK_URL = "https://discord.com/api/webhooks/869233265628827658/tb5qc_Uq8IPrT8cfYUZ6SPWj8VINcaSU6F1kgxv5meDtBcgOv8DS1HmOIf2QLDv2lEKx",
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

export enum Messages {

}
