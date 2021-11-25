import { Schema, model, Model } from "mongoose";

export interface IOracle {
  chain: string;
  urls: string[];
}

const oracleSchema = new Schema<IOracle>({
  chain: { type: String, required: true, unique: true },
  urls: [String],
});

export const OraclesModel: Model<IOracle> = model("oracles", oracleSchema);
