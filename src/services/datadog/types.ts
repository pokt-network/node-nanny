export interface LogGroupList {
  name: string;
  logGroup: string;
}

export enum ApiDetails {
  BASE_URL = "https://api.datadoghq.eu/api/v1",
}

export enum LogTypes {
  LOG = "log alert",
}

export enum Thresholds {
  CRITICAL = 2.0,
  WARNING = 1.0,
}

export enum Webhooks {
  API_PRODUCTION = "@webhook-API-Production",
}
export enum AlertColor {
  ERROR = 15548997,
  SUCCESS = 3066993,
  WARNING = 16776960,
  INFO = 3447003,
}

export enum Status {
  ALERT = "Alert",
  OK = "OK",
}

export interface WebhookInput {}

export interface WebhookOutput {
  event: string;
  color: number;
  chain: string;
  host: string;
  container: string;
  id: string;
  transition: string;
  type: string;
  title: string;
}
