import { model, Model, Schema, Types } from "mongoose";

export interface IChain {
  id: Types.ObjectId;
  chain: string;
  name: string;
  type: string;
  variance?: number;
}

export const chainSchema = new Schema<IChain>(
  {
    name: { type: String, unique: true, required: true },
    chain: { type: String, required: true },
    type: { type: String, required: true },
    variance: { type: Number },
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model("chains", chainSchema);
