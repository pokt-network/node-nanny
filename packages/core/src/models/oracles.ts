import { Schema, model, Model } from "mongoose";
import { IChain } from "./chains";

export interface IOracle {
  id: string;
  chain: string;
  urls: string[];
}

const oracleSchema = new Schema<IOracle>(
  {
    chain: { type: String, unique: true },
    urls: [String],
  },
  { timestamps: true },
);

export const OraclesModel: Model<IOracle> = model("oracles", oracleSchema);
