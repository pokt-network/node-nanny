import { model, Model, Schema, Types } from 'mongoose';

export interface IChain {
  id: Types.ObjectId;
  name: string;
  type: string;
  chainId: string;
  allowance: number;

  /** The HTTP method the health check for the Chain uses */
  method: string;
  rpc: string;
  responsePath: string;
  healthyValue: string;
  hasOwnEndpoint: boolean;
  useOracles: boolean;
  endpoint?: string;

  updatedAt: string;
}

export const chainSchema = new Schema<IChain>(
  {
    name: { type: String, unique: true, required: true },
    type: { type: String, required: true },
    chainId: { type: String, required: true },
    allowance: { type: Number, required: true },

    method: { type: String, required: true, enum: ['get', 'post'] },
    rpc: { type: String, required: true },
    responsePath: { type: String, required: true },
    healthyValue: { type: String, required: true },
    hasOwnEndpoint: { type: Boolean, required: true },
    useOracles: { type: Boolean, required: true },
    endpoint: { type: String },
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model('Chains', chainSchema);
