import { model, Model, Schema, Types } from "mongoose";

export interface IChain {
  id: Types.ObjectId;
  name: string;
  type: string;
  allowance?: number;
  createdAt: string
}

export const chainSchema = new Schema<IChain>(
  {
    name: { type: String, unique: true, required: true },
    type: { type: String, required: true },
    allowance: { type: Number },
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model("Chains", chainSchema);
