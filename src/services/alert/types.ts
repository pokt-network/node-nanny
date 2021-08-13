export enum AlertChannel {
  DISCORD = "discord",
  PAGER_DUTY = "pd",
  BOTH = "both",
}

export enum DiscordDetails {
  WEBHOOK_URL = "https://discord.com/api/webhooks/873322545040994345/zI03qrMhIwcB_SEQK2QRDXdfLRif2pEFe4AzOQrmpriXogB6-ubEbyPDmkHY4Z1-dBlm",
  WEBHOOK_TEST = "https://discord.com/api/webhooks/873283996862283787/x5__JNbgMcvSHEw3NxI9J5Sj5241VwoEY2vGAuWCQdefQQr5vTNYNM3nIeEoLAVYnYMb",
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

export enum HostsForReboot {
  A = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-0-149.us-east-2.compute.internal",
  B = "ip-10-0-0-55.us-east-2.compute.internal", //"ip-10-0-1-208.us-east-2.compute.internal",
}
//ip-10-0-0-55.us-east-2.compute.internal
