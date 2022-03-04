import { Schema, model, Model } from "mongoose";

export interface IWebhook {
  chain: string;
  url: string;
  location: string;
}

const webhookSchema = new Schema<IWebhook>(
  {
    chain: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    location: { type: String, required: true },
  },
  { timestamps: true },
);

webhookSchema.index({ chain: 1, location: 1 }, { unique: true });

export const WebhookModel: Model<IWebhook> = model("webhooks", webhookSchema);
