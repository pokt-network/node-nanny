import { model, Model, Schema, Types } from "mongoose";

import { IChain } from "./chains";
import { IHost } from "./hosts";
import { HealthTypes } from "../types";

export interface INode<Populated = true> {
  id: Types.ObjectId;
  chain: Populated extends true ? IChain : Types.ObjectId;
  host: Populated extends true ? IHost : Types.ObjectId;
  name: string;
  port: number;
  url: string;
  muted: boolean;
  status: HealthTypes.EErrorStatus;
  conditions: HealthTypes.EErrorConditions;
  loadBalancers?: (Populated extends true ? IHost : Types.ObjectId)[];
  backend?: string;
  frontend?: string;
  server?: string;
  basicAuth?: string;
  automation?: boolean;
  dispatch?: boolean;
  heightArray?: number[];
}

const nodesSchema = new Schema<INode>(
  {
    chain: { type: Schema.Types.ObjectId, ref: "Chains", required: true },
    host: { type: Schema.Types.ObjectId, ref: "Hosts", required: true },
    name: { type: String, required: true, unique: true },
    port: { type: Number, required: true },
    url: { type: String, required: true },
    muted: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: Object.values(HealthTypes.EErrorStatus),
      default: HealthTypes.EErrorStatus.PENDING,
    },
    conditions: {
      type: String,
      enum: Object.values(HealthTypes.EErrorConditions),
      default: HealthTypes.EErrorConditions.PENDING,
    },
    loadBalancers: [{ type: Schema.Types.ObjectId, ref: "Hosts" }],
    backend: String,
    frontend: String,
    server: String,
    basicAuth: String,
    automation: Boolean,
    dispatch: Boolean,
    heightArray: [Number],
  },
  { timestamps: true },
);

nodesSchema.index({ name: 1 });
nodesSchema.index(
  { host: 1, port: 1, server: 1 },
  { unique: true, partialFilterExpression: { server: { $type: "string" } } },
);

export const NodesModel: Model<INode> = model("Nodes", nodesSchema);
