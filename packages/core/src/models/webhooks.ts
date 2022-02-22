import { Schema, model, Model } from "mongoose";
import { IChain } from "./chains";

export interface IWebhook {
  chain: IChain;
  location: string;
  url: string;
}

const webhookSchema = new Schema<IWebhook>(
  {
    chain: { type: Schema.Types.ObjectId, ref: "chains" },
    location: String,
    url: String,
  },
  { timestamps: true },
);

export const WebhookModel: Model<IWebhook> = model("webhooks", webhookSchema);
