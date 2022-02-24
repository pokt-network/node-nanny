import { Schema, model, Model } from "mongoose";

export interface IWebhook {
  chain: string;
  location: string;
  url: string;
}

const webhookSchema = new Schema<IWebhook>(
  {
    chain: { type: String, unique: true },
    location: String,
    url: String,
  },
  { timestamps: true },
);

export const WebhookModel: Model<IWebhook> = model("webhooks", webhookSchema);
