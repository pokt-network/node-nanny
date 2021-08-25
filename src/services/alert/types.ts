export enum DiscordDetails {
  WEBHOOK_URL = "https://discord.com/api/webhooks/873322545040994345/zI03qrMhIwcB_SEQK2QRDXdfLRif2pEFe4AzOQrmpriXogB6-ubEbyPDmkHY4Z1-dBlm",
  WEBHOOK_TEST = "https://discord.com/api/webhooks/873283996862283787/x5__JNbgMcvSHEw3NxI9J5Sj5241VwoEY2vGAuWCQdefQQr5vTNYNM3nIeEoLAVYnYMb",
}

interface DiscordFields {
  name: string;
  value: string;
}
export interface DiscordInput {
  title: string;
  color: number;
  fields: DiscordFields[];
}
