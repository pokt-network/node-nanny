import { connect, disconnect, Schema, model, Model, Types } from "mongoose";
import { ChainsModel, HostsModel, NodesModel } from "./models";

interface IHostProd {
  _id: Types.ObjectId;
  name: string;
  internalIpaddress: string;
  internalHostName: string;
  externalHostName: string;
  awsInstanceId: string;
  loadBalancer: boolean;
  hostType: string;
}
interface IChainProd {
  chain: string;
  name: string;
  type: string;
  variance: number;
}
interface INodeProd {
  _id: Types.ObjectId;
  backend: string;
  chain: IChainProd;
  container: string;
  haProxy: boolean;
  hasPeer: boolean;
  id: string;
  host: IHostProd;
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
  loadBalancers: IHostProd[];
}
const chainSchemaProd = new Schema<IChainProd>({
  chain: String,
  name: String,
  type: String,
  variance: Number,
});
const hostsSchemaProd = new Schema<IHostProd>({
  name: String,
  internalIpaddress: String,
  internalHostName: String,
  externalHostName: String,
  awsInstanceId: String,
  loadBalancer: Boolean,
  hostType: String,
});
const nodesSchemaProd = new Schema<INodeProd>(
  {
    id: String,
    backend: String,
    chain: chainSchemaProd,
    container: String,
    haProxy: Boolean,
    reboot: Boolean,
    hasPeer: Boolean,
    host: hostsSchemaProd,
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
    removeNoResponse: Boolean,
    loadBalancers: [hostsSchemaProd],
  },
  { collection: "nodes" },
);
const NodesModelProd: Model<INodeProd> = model("nodes", nodesSchemaProd);

/* ------ Script Function Begins ------ */
(async () => {
  /* ------ Connect to Production Inventory DB ------*/
  await connect(
    "mongodb+srv://node-monitor:4ZRH7jjdEheEtXwN@node-monitor.kxobp.mongodb.net/node-monitor?authSource=admin",
  );

  const nodesProd = await NodesModelProd.find({});

  await disconnect();

  /* ------ Connect to New Inventory DB ------ */
  await connect(process.env.MONGO_URI);
  /* 5) Create Nodes */
  let nodesCreated = 0;
  let nodesNotCreated = [];
  for await (const node of nodesProd) {
    const { id: hostId } = await HostsModel.findOne({ name: node.host.name });

    const query: any = { host: hostId, port: Number(node.port) };
    if (node.server) query.server = node.server;
    const newNode = await NodesModel.findOne(query);

    if (newNode) {
      const chain = await ChainsModel.findOne({ _id: newNode.chain });
      if (chain) {
        const name =
          chain.type === "POKT"
            ? node.hostname.split(".")[0]
            : `${chain.name}/${node.container}`;

        // await NodesModel.updateOne({ _id: newNode.id }, { name });
        console.log("TEST RUN", { name });
        nodesCreated++;
        console.log(`Created ${nodesCreated} of ${nodesProd.length} nodes...`);
      } else {
        nodesNotCreated.push(node);
      }
    } else {
      nodesNotCreated.push(node);
    }
  }

  console.log(`Created ${nodesCreated} of ${nodesProd.length} nodes...`);
  console.log(`Unable to create ${nodesNotCreated.length}. ${{ nodesNotCreated }}`);

  await disconnect();

  console.log("Fin.");
})();
