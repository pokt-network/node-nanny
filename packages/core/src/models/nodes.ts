import { Schema, model, Model } from "mongoose";
import { IChain } from "./chains";
import { IHost } from "./hosts";

export interface INode {
  id: Schema.Types.ObjectId;
  chain: IChain;
  host: IHost;
  backend: string;
  container: string;
  haProxy: boolean;
  hasPeer: boolean;
  hostname: string;
  reboot: boolean;
  monitorId: string;
  port: number;
  server: string;
  threshold: number;
  url: string;
  variance: number;
  logGroup: string;
  nginx: string;
  compose: string;
  poktType: string;
  service: string;
  removeNoResponse: boolean;
  docker: boolean;
  basicAuth: string;
  ssl: boolean;
  loadBalancers: string[];
}

const nodesSchema = new Schema<INode>(
  {
    id: Schema.Types.ObjectId,
    chain: { type: Schema.Types.ObjectId, ref: "chains" },
    host: { type: Schema.Types.ObjectId, ref: "hosts" },
    backend: String,
    container: String,
    haProxy: Boolean,
    reboot: Boolean,
    hasPeer: Boolean,
    hostname: String,
    monitorId: String,
    port: Number,
    server: String,
    threshold: Number,
    url: String,
    variance: Number,
    logGroup: String,
    nginx: String,
    poktType: String,
    compose: String,
    docker: Boolean,
    service: String,
    removeNoResponse: Boolean,
    basicAuth: String,
    ssl: Boolean,
    loadBalancers: [Schema.Types.ObjectId],
  },
  { collection: "nodes", timestamps: true },
);

nodesSchema.index({ port: 1, server: 1 }, { unique: true });

export const NodesModel: Model<INode> = model("nodes", nodesSchema);
