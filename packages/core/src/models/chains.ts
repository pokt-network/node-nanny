import { model, Model, Schema, Types } from 'mongoose';

export interface IChain {
  id: Types.ObjectId;
  name: string;
  type: string;
  /** The relay chain ID - used for visual reference in the UI only. Not used in backend code. */
  chainId: string;
  /** The amount of blocks the node can be behind the reference (oracle or peer) before being considered out of sync */
  allowance: number;

  /** Whether the chain provides its own endpoint for health checks. */
  hasOwnEndpoint: boolean;
  /** Whether the chain uses external RPC endpoints (oracles) to check block height. */
  useOracles: boolean;
  /** The object path that contains the health check response field. RESPONSE IS AN AxiosResponse SO TOP LEVEL IS "status", "data", etc.
   * - ex: "status" or "data.result.healthy" */
  responsePath: string;
  /** (Optional) The RPC request body used for the chain health check. MUST BE VALID JSON.
   * - ex: '{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }' */
  rpc: string | null;
  /** (Optional) The URL path appended to the node's URL to check health. MUST INCLUDE LEADING SLASH.
   * - ex: "/health" or "/v1/query/height" or "/status" */
  endpoint: string | null;
  /** (Optional - hasOwnEndpoint: true ONLY) The value used to determine if a node is healthy.
   * - ex: "healthy" or "200" or "true" */
  healthyValue: string | null;

  /** Used by the `updater` job to determine if there are newer Chains in the Node Nanny prod DB */
  updatedAt: string;
}

export const chainSchema = new Schema<IChain>(
  {
    name: { type: String, unique: true, required: true },
    type: { type: String, required: true },
    chainId: { type: String, required: true },
    allowance: { type: Number, required: true },

    hasOwnEndpoint: { type: Boolean, required: true },
    useOracles: { type: Boolean, required: true },
    responsePath: { type: String, required: true },
    rpc: { type: String },
    endpoint: { type: String },
    healthyValue: { type: String },
  },
  { timestamps: true },
);

export const ChainsModel: Model<IChain> = model('Chains', chainSchema);
