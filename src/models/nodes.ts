import { Schema, model, Model } from "mongoose";
import { IChain, chainSchema } from "./chains";
import { IHost, hostsSchema } from "./hosts";

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
}

const nodesSchema = new Schema<INode>(
    {
      id: String,
      backend: String,
      chain: chainSchema,
      container: String,
      haProxy: Boolean,
      reboot: Boolean,
      hasPeer: Boolean,
      host: hostsSchema,
      hostname: { type: String, unique: true },
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
      removeNoResponse: Boolean
    },
    { collection: "nodes" },
  );

  
export const NodesModel: Model<INode> = model("nodes", nodesSchema);
