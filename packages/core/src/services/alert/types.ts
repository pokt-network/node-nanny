export enum Webhooks {
  WEBHOOK_CRITICAL = "https://discord.com/api/webhooks/880886405402865695/zzeJxcvdTPHzcdJWiTRHaPPsyTgF2n298bYh8G3wNqQB0b-to_tmaTUQYyM-V6010Tvr",
  WEBHOOK_NON_CRITICAL = "https://discord.com/api/webhooks/880219881881092116/XBTKuSSf4ZSIpF736FRwsoRaS6vzJhkbPgRANw-NPVmI4DrsZf4CGCJu-fdpbR57SbmV",
  WEBHOOK_LOGS = "https://discord.com/api/webhooks/882767668019593216/O9Txt1yQoUuo8wqIOOx5HFAOwCMhVOWmjFQJEHhDdagGh7cYy3t9SMDo_dMuXUBc8hzp",
  WEBHOOK_ERRORS = "https://discord.com/api/webhooks/895805822569943060/EBN7fVY1KU2Xunl66hk0awg33Y1ajZpQC6EkMMH1L66tGwOMJ2t1czfygTabbTJmM-QB",
  WEBHOOK_CRITICAL_TEST = "https://discord.com/api/webhooks/895805548618985482/4aq_LbAMIhgs7qhDxon98UMEmiUsg4ea8BIhnhBKIWnGzk5FvK7faEe_2x2PtqWB1tf4",
  WEBHOOK_NON_CRITICAL_TEST = "https://discord.com/api/webhooks/895805666109841418/S8m3T6TB7jUEyfC3KuDNPGIIlzspUyH1_qRevyhzpi4WQb-OynxZK1Qra9uA4bTFXqQ3",
  WEBHOOK_LOGS_TEST = "https://discord.com/api/webhooks/895805747248660550/izL7W9LwsQijskZyFuYzB551-uhOL7k5uzih3IoTzt578oz_JWsw7VUQlz7ORp5bnDXX",
  WEBHOOK_ERRORS_TEST = "https://discord.com/api/webhooks/895805822569943060/EBN7fVY1KU2Xunl66hk0awg33Y1ajZpQC6EkMMH1L66tGwOMJ2t1czfygTabbTJmM-QB",
  DATADOG_ALERTS = "https://discord.com/api/webhooks/912802442201141299/BUtDZp0zYY5ObjtylJ23k0bEEqUfkR0O7rbJIPAXuyLH8Fee7-OmqwD1MT-MSGStWfas",
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
  SERVICE_ID = "P01UMQB",
  SERVICE_TYPE = "service_reference",
  TYPE = "incident",
}

export enum PagerDutyServices {
  CRITICAL = "P01UMQB",
  NODE_INFRA = "PG93GUY",
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

export type ISendAlert = ({
  title,
  message,
  chain,
}: IWebhookMessageParams) => Promise<boolean>;

export interface IWebhookMessageParams {
  title: string;
  message: string;
  chain?: string;
}
