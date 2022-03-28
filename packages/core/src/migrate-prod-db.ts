import { connect, disconnect, Schema, model, Model, Types } from "mongoose";
import {
  ChainsModel,
  HostsModel,
  LocationsModel,
  NodesModel,
  OraclesModel,
} from "./models";
import { Service as AutomationService } from "./services/automation";

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

interface IOracleProd {
  chain: string;
  urls: string[];
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

const oracleSchemaProd = new Schema<IOracleProd>({
  chain: { type: String, required: true, unique: true },
  urls: [String],
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

const HostsModelProd: Model<IHostProd> = model("hosts", hostsSchemaProd);
const NodesModelProd: Model<INodeProd> = model("nodes", nodesSchemaProd);
const ChainsModelProd: Model<IChainProd> = model("chains", chainSchemaProd);
const OraclesModelProd: Model<IOracleProd> = model("oracles", oracleSchemaProd);

const getHostLocation = async (host: IHostProd): Promise<Types.ObjectId> => {
  const hostLocation = host.internalHostName?.split(".")[1];
  const hostLocationCode =
    {
      "us-east-2": "USE2",
      "ap-southeast-1": "APSE1",
      "us-west-2": "USW2",
    }[hostLocation] || "USE2";
  if (hostLocationCode) {
    const [{ _id: locationId }] = await LocationsModel.find({
      name: hostLocationCode as any,
    });
    return locationId;
  }
};

const getFQDN = (node): string => {
  return node?.url.includes("https") ? node.hostname : undefined;
};

/* ------ Script Function Begins ------ */
(async () => {
  /* ------ Connect to Production Inventory DB ------*/
  await connect("PROD_MONGO_URI_GOES_HERE");

  const chainsProd = await ChainsModelProd.find({});
  const oraclesProd = await OraclesModelProd.find({});
  const hostsProd = await HostsModelProd.find({ name: { $not: { $regex: /dispatch/ } } });
  const nodesProd = await NodesModelProd.find({
    "host.name": { $not: { $regex: /dispatch/ } },
  });

  console.log(
    `Fetched ${chainsProd.length} chains, ${oraclesProd.length} oracles, ${hostsProd.length} hosts and ${nodesProd.length} nodes from the production database.`,
  );

  await disconnect();

  /* ------ Connect to New Inventory DB ------ */
  await connect(process.env.MONGO_URI);

  /* 1) Create Chains */
  let chainsCreated = 0;
  for await (let chain of chainsProd) {
    const chainInput = {
      chain: chain.chain,
      type: chain.type,
      name: chain.name,
      allowance: chain.variance,
    };
    if (chain.type === "ETH") chainInput.type = "EVM";
    if (chain.type === "HRM") chainInput.type = "HMY";
    if (chain.type === "HEI") chainInput.type = "TMT";

    await ChainsModel.create(chainInput);
    chainsCreated++;
    console.log(`Created ${chainsCreated} of ${chainsProd.length} chains ...`);
  }
  console.log("Finished creating Chains.");

  /* 2) Create Oracles */
  let oraclesCreated = 0;
  for await (const oracle of oraclesProd) {
    await OraclesModel.create({
      chain: oracle.chain,
      urls: oracle.urls,
    });
    oraclesCreated++;
    console.log(`Created ${oraclesCreated} of ${oraclesProd.length} oracles ...`);
  }
  await OraclesModel.create({
    chain: "HRM",
    urls: ["https://api.s0.t.hmny.io", "https://api.harmony.one"],
  });
  console.log("Finished creating Oracles.");

  /* 3) Create Locations */
  let locationsCreated = 0;
  const locations = [
    "NL",
    "LI",
    "DE",
    "USE1",
    "USE2",
    "USW2",
    "HK",
    "LDN",
    "SG",
    "APSE1",
  ];
  for await (const location of locations) {
    await LocationsModel.create({ name: location });
    locationsCreated++;
    console.log(`Created ${locationsCreated} of ${locations.length} locations ...`);
  }
  console.log("Finished creating Locations.");

  /* 4) Create Hosts */
  let hostsCreated = 0;
  for await (const host of hostsProd) {
    const location = await getHostLocation(host);
    const exists = !!(await HostsModel.exists({ name: host.name }));

    console.log({ location, exists });

    if (location && !exists) {
      const node = nodesProd.find(({ host: hostProd }) => hostProd._id === host._id);

      const hostInput: any = {
        name: host.name,
        loadBalancer: host.loadBalancer || false,
        location,
      };
      if (host.name.includes("harmony-new")) {
        hostInput.name = host.name.split("-new").join("");
      }
      if (host.name.includes("mainnet")) {
        hostInput.fqdn = {
          mainnet1: "mainnet-1-instance.nodes.pokt.network",
          mainnet2: "mainnet-2-instance.nodes.pokt.network",
        }[host.name];
      } else if (node && getFQDN(node)) {
        hostInput.fqdn = getFQDN(node);
      }
      if (host.internalIpaddress && !hostInput.fqdn) {
        hostInput.ip = host.internalIpaddress;
      }

      await HostsModel.create(hostInput);
      hostsCreated++;
      console.log(`Created ${hostsCreated} of ${hostsProd.length} hosts ...`);
    }
    console.log("Finished creating Hosts.");
  }

  /* 5) Create Nodes */
  let nodesCreated = 0;
  for await (const node of nodesProd) {
    if (node.port) {
      const exists = !!(await NodesModel.exists({
        port: node.port,
        server: node.server,
      }));

      const isHarmony = node.host.name.includes("harmony-new");
      const hostName = isHarmony ? node.host.name.split("-new").join("") : node.host.name;
      const url = isHarmony ? node.url.replace("5000", "9500") : node.url;
      const port = isHarmony ? 9500 : Number(node.port);

      if (!exists) {
        await new AutomationService().createNode(
          {
            chain: (await ChainsModel.findOne({ name: node.chain.name }))._id,
            host: (await HostsModel.findOne({ name: hostName }))._id,
            haProxy: node.haProxy,
            port,
            url,
            loadBalancers: (
              await HostsModel.find({
                name: { $in: node.loadBalancers.map(({ name }) => name) },
              })
            ).map(({ _id }) => _id),
            backend: node.backend,
            server: node.server,
          },
          false,
        );
        nodesCreated++;
        console.log(`Created ${nodesCreated} of ${nodesProd.length} nodes ...`);
      }
    }
  }
  console.log("Finished creating Nodes.");

  await disconnect();
})();
