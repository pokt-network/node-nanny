import { Schema, model, Model, Types } from 'mongoose';

export interface IOracle {
  id: Types.ObjectId;
  chain: string;
  urls: string[];
  updatedAt: string;
}

export const oraclesSchema = new Schema<IOracle>(
  {
    chain: { type: String, unique: true },
    urls: [String],
  },
  { timestamps: true },
);

export const OraclesModel: Model<IOracle> = model('Oracles', oraclesSchema);
