import { model, Model, Schema, Types } from "mongoose";

import { IChain } from "./chains";
import { IHost } from "./hosts";

export interface INode<Populated = true> {
  id: Types.ObjectId;
  chain: Populated extends true ? IChain : Types.ObjectId;
  host: Populated extends true ? IHost : Types.ObjectId;
  port: number;
  url: string;
  muted: boolean;
  loadBalancers?: (Populated extends true ? IHost : Types.ObjectId)[];
  backend?: string;
  frontend?: string;
  server?: string;
  basicAuth?: string;
  haProxy?: boolean;
}

const nodesSchema = new Schema<INode>(
  {
    chain: { type: Schema.Types.ObjectId, ref: "Chains", required: true },
    host: { type: Schema.Types.ObjectId, ref: "Hosts", required: true },
    port: { type: Number, required: true },
    url: { type: String, required: true },
    muted: { type: Boolean, required: true, default: false },
    loadBalancers: [{ type: Schema.Types.ObjectId, ref: "Hosts" }],
    backend: String,
    frontend: String,
    server: String,
    basicAuth: String,
    haProxy: Boolean,
  },
  { timestamps: true },
);

nodesSchema.index(
  { host: 1, port: 1, server: 1 },
  { unique: true, partialFilterExpression: { server: { $type: "string" } } },
);

export const NodesModel: Model<INode> = model("Nodes", nodesSchema);
