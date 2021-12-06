import { Schema, model, Model } from "mongoose";
import { IChain } from "./chains";
import { IHost } from "./hosts";

export interface INode {
  backend: string;
  chain: IChain;
  container: string;
  haProxy: boolean;
  hasPeer: boolean;
  id: string;
  host: IHost;
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
}

const nodesSchema = new Schema<INode>(
  {
    id: String,
    backend: String,
    chain: {
      type: Schema.Types.ObjectId,
      ref: "chains",
    },
    container: String,
    haProxy: Boolean,
    reboot: Boolean,
    hasPeer: Boolean,
    host: {
      type: Schema.Types.ObjectId,
      ref: "hosts",
    },
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
  },
  { collection: "nodes" },
);


export const NodesModel: Model<INode> = model("nodes", nodesSchema);
