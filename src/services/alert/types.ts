export enum Webhooks {
  WEBHOOK_CRITICAL = "https://discord.com/api/webhooks/873322545040994345/zI03qrMhIwcB_SEQK2QRDXdfLRif2pEFe4AzOQrmpriXogB6-ubEbyPDmkHY4Z1-dBlm",
  WEBHOOK_NON_CRITICAL = "https://discord.com/api/webhooks/880219881881092116/XBTKuSSf4ZSIpF736FRwsoRaS6vzJhkbPgRANw-NPVmI4DrsZf4CGCJu-fdpbR57SbmV",
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