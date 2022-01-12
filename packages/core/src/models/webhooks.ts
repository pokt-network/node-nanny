import { Schema, model, Model } from "mongoose";
export interface IWebhook {
  chain: string;
  url: string;
}

const webhookSchema = new Schema<IWebhook>({
  chain: String,
  url: String,
});

export const WebhookModel: Model<IWebhook> = model("webhooks", webhookSchema);
