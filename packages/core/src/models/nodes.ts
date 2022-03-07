import { model, Model, Schema, Types } from "mongoose";

import { IChain } from "./chains";
import { IHost } from "./hosts";

export interface INode<Populated = true> {
  id: Types.ObjectId;
  chain: Populated extends true ? IChain : Types.ObjectId;
  host: Populated extends true ? IHost : Types.ObjectId;
  haProxy: boolean;
  port: number;
  url: string;
  muted: boolean;
  loadBalancers?: (Populated extends true ? IHost : Types.ObjectId)[];
  backend?: string;
  server?: string;

  // Old model
  container: string;
  hasPeer: boolean;
  hostname: string;
  reboot: boolean;
  monitorId: string;
  threshold: number;
  variance: number;
  logGroup: string;
  nginx: string;
  compose: string;
  poktType: string;
  service: string;
  removeNoResponse: boolean;
  docker: boolean;
  ssl?: boolean;
  basicAuth?: string;
}

const nodesSchema = new Schema<INode>(
  {
    chain: { type: Schema.Types.ObjectId, ref: "chains", required: true },
    host: { type: Schema.Types.ObjectId, ref: "hosts", required: true },
    haProxy: { type: Boolean, required: true },
    port: { type: Number, required: true },
    url: { type: String, required: true },
    muted: { type: Boolean, required: true, default: false },
    loadBalancers: [{ type: Schema.Types.ObjectId, ref: "hosts" }],
    backend: String,
    server: String,

    // Old model
    container: String,
    reboot: Boolean,
    hasPeer: Boolean,
    hostname: String,
    monitorId: String,
    threshold: Number,
    variance: Number,
    logGroup: String,
    nginx: String,
    poktType: String,
    compose: String,
    docker: Boolean,
    service: String,
    removeNoResponse: Boolean,
    ssl: Boolean,
  },
  { collection: "nodes", timestamps: true },
);

nodesSchema.index({ port: 1, server: 1 }, { unique: true });

export const NodesModel: Model<INode> = model("nodes", nodesSchema);
