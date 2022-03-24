import { model, Model, Schema, Types } from "mongoose";

export interface IChain {
  id: Types.ObjectId;
  chain: string;
  name: string;
  type: string;
  allowance?: number;
}

export const chainSchema = new Schema<IChain>(
  {
    name: { type: String, unique: true, required: true },
    chain: { type: String, required: true },
    type: { type: String, required: true },
    allowance: { type: Number },
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model("Chains", chainSchema);
