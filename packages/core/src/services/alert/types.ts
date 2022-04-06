export enum Webhooks {
  WEBHOOK_CRITICAL = "***REMOVED***",
  WEBHOOK_NON_CRITICAL = "***REMOVED***",
  WEBHOOK_LOGS = "***REMOVED***",
  WEBHOOK_ERRORS = "***REMOVED***",
  WEBHOOK_CRITICAL_TEST = "***REMOVED***",
  WEBHOOK_NON_CRITICAL_TEST = "***REMOVED***",
  WEBHOOK_LOGS_TEST = "***REMOVED***",
  WEBHOOK_ERRORS_TEST = "***REMOVED***",
  DATADOG_ALERTS = "***REMOVED***",
}

interface SendMessageFields {
  name: string;
  value: string;
}
export interface SendMessageInput {
  channel: string;
  title: string;
  color: number;
  fields: SendMessageFields[];
}

export enum PagerDutyDetails {
  BODY_TYPE = "incident_body",
  FROM = "john@pokt.network",
  SERVICE_ID = "***REMOVED***",
  SERVICE_TYPE = "service_reference",
  TYPE = "incident",
}

export enum PagerDutyServices {
  CRITICAL = "***REMOVED***",
  NODE_INFRA = "***REMOVED***",
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
  RETRIGGER = 15105570,
}

export type ISendAlert = ({ title, message, chain }: IAlertParams) => Promise<boolean>;

export interface IAlertParams {
  title: string;
  message: string;
  chain?: string;
  frontend?: boolean;
}
