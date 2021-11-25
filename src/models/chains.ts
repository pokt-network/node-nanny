import { Schema, model, Model } from "mongoose";

export interface IChain {
    chain: string;
    name: string;
    type: string;
  }
  
export const chainSchema = new Schema<IChain>({
    chain: String,
    name: String,
    type: String,
  });

export const ChainsModel: Model<IChain> = model("chains", chainSchema);
