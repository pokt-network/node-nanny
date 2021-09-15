export enum Webhooks {
  WEBHOOK_CRITICAL = "https://discord.com/api/webhooks/880886405402865695/zzeJxcvdTPHzcdJWiTRHaPPsyTgF2n298bYh8G3wNqQB0b-to_tmaTUQYyM-V6010Tvr",
  WEBHOOK_NON_CRITICAL = "https://discord.com/api/webhooks/880219881881092116/XBTKuSSf4ZSIpF736FRwsoRaS6vzJhkbPgRANw-NPVmI4DrsZf4CGCJu-fdpbR57SbmV",
  WEBHOOK_LOGS = "https://discord.com/api/webhooks/882767668019593216/O9Txt1yQoUuo8wqIOOx5HFAOwCMhVOWmjFQJEHhDdagGh7cYy3t9SMDo_dMuXUBc8hzp",
  WEBHOOK_ERRORS = "https://discord.com/api/webhooks/883392489166344192/fj-2aKNTSMbXghSLKbiuovnsvl50yyIEsT95DXVOI-e9qsC2v8xMK1AXaGlrpew_EGcM",
  WEBHOOK_TEST = "https://discord.com/api/webhooks/873283996862283787/x5__JNbgMcvSHEw3NxI9J5Sj5241VwoEY2vGAuWCQdefQQr5vTNYNM3nIeEoLAVYnYMb",
}

interface SendMessageFields {
  name: string;
  value: string;
}
export interface SendMessageInput {
  channel: Webhooks;
  title: string;
  color: number;
  fields: SendMessageFields[];
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

export enum AlertColor {
  ERROR = 15548997,
  SUCCESS = 3066993,
  WARNING = 16776960,
  INFO = 3447003,
}
