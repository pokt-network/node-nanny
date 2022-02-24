import { Schema, model, Model } from "mongoose";

export interface IChain {
  id: Schema.Types.ObjectId;
  chain: string;
  name: string;
  type: string;
  variance: number;
}

export const chainSchema = new Schema<IChain>(
  {
    id: Schema.Types.ObjectId,
    name: { type: String, unique: true },
    chain: String,
    type: String,
    variance: Number,
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model("chains", chainSchema);
