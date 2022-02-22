import { Schema, model, Model } from "mongoose";
import { IChain } from "./chains";
export interface IOracle {
  id: string;
  chain: IChain;
  urls: string[];
}

const oracleSchema = new Schema<IOracle>(
  {
    chain: { type: Schema.Types.ObjectId, ref: "chains" },
    urls: [String],
  },
  { timestamps: true },
);

export const OraclesModel: Model<IOracle> = model("oracles", oracleSchema);
