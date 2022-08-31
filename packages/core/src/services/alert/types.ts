import env from '../../environment';

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
  BODY_TYPE = 'incident_body',
  FROM = 'john@pokt.network',
  SERVICE_TYPE = 'service_reference',
  TYPE = 'incident',
}

export enum IncidentLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum AlertColor {
  ERROR = 15548997,
  SUCCESS = 3066993,
  WARNING = 16776960,
  INFO = 3447003,
  RETRIGGER = 15105570,
}

export type ISendAlert = ({ title, message, chain }: IAlertParams) => Promise<boolean>;

export interface IErrorChannelAlertParams {
  title: string;
  message: string;
}

export interface IAlertParams {
  title: string;
  message: string;
  chain: string;
  location: string;
  frontend?: boolean;
}
