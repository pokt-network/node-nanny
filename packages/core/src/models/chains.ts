import { Schema, model, Model } from "mongoose";

export interface IChain {
  chain: string;
  name: string;
  type: string;
  variance: number;
}

export const chainSchema = new Schema<IChain>(
  {
    name: { type: String, unique: true },
    chain: String,
    type: String,
    variance: Number,
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model("chains", chainSchema);
