export enum Webhooks {
  WEBHOOK_CRITICAL = "***REMOVED***",
  WEBHOOK_NON_CRITICAL = "***REMOVED***",
  WEBHOOK_LOGS = "***REMOVED***",
  WEBHOOK_ERRORS = "https://discord.com/api/webhooks/883392489166344192/fj-2aKNTSMbXghSLKbiuovnsvl50yyIEsT95DXVOI-e9qsC2v8xMK1AXaGlrpew_EGcM",
  WEBHOOK_CRITICAL_TEST = "***REMOVED***",
  WEBHOOK_NON_CRITICAL_TEST = "***REMOVED***",
  WEBHOOK_LOGS_TEST = "***REMOVED***",
  WEBHOOK_ERRORS_TEST = "***REMOVED***",
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
