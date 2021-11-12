import { Schema, model, Model } from "mongoose";

export interface IHost {
  name: string;
  internalIpaddress: string;
  internalHostName: string;
  externalHostName: string;
  awsInstanceId: string;
  loadBalancer: boolean;
  dockerHost: boolean;
  hostType: string;
}

interface IChain {
  chain: string;
  name: string;
  type: string;
}

export interface IOracle {
  chain: string;
  urls: string[];
}

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
}

const chainSchema = new Schema<IChain>({
  chain: String,
  name: String,
  type: String,
});

const oracleSchema = new Schema<IOracle>({
  chain: { type: String, required: true, unique: true },
  urls: [String],
});

const hostsSchema = new Schema<IHost>({
  name: String,
  internalIpaddress: String,
  internalHostName: String,
  externalHostName: String,
  awsInstanceId: String,
  loadBalancer: Boolean,
  dockerHost: Boolean,
  hostType: String,
});

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
  },
  { collection: "nodes" },
);

const ChainsModel: Model<IChain> = model("chains", chainSchema);

const OraclesModel: Model<IOracle> = model("oracles", oracleSchema);

const HostsModel: Model<IHost> = model("hosts", hostsSchema);

const NodesModel: Model<INode> = model("nodes", nodesSchema);

export { HostsModel, NodesModel, OraclesModel, ChainsModel };
