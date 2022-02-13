import { Schema, model, Model } from "mongoose";
export interface IWebhook {
  location: string;
  chain: string;
  url: string;
}

const webhookSchema = new Schema<IWebhook>({
  location: String,
  chain: String,
  url: String,
});

export const WebhookModel: Model<IWebhook> = model("webhooks", webhookSchema);
