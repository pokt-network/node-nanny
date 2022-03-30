import { connect, disconnect, Schema, model, Model, Types } from "mongoose";
import {
  ChainsModel,
  HostsModel,
  LocationsModel,
  NodesModel,
  OraclesModel,
} from "./models";
import { Service as AutomationService } from "./services/automation";
import { INodeInput } from "./services/automation/types";
import { Service as DiscordService } from "./services/discord";

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
  await connect(process.env.PROD_MONGO_URI);

  const chainsProd = await ChainsModelProd.find({});
  const oraclesProd = await OraclesModelProd.find({});
  const hostsProd = await HostsModelProd.find({});
  const nodesProd = await NodesModelProd.find({});

  console.log(
    `Fetched ${chainsProd.length} chains, ${oraclesProd.length} oracles, ${hostsProd.length} hosts and ${nodesProd.length} nodes from the production database.`,
  );

  await disconnect();

  /* ------ Connect to New Inventory DB ------ */
  await connect(process.env.MONGO_URI);

  const hostsNotCreated: IHostProd[] = [];
  const nodesNotCreated: INodeProd[] = [];

  /* 1) Create Chains */
  let chainsCreated = 0;
  for await (let chain of chainsProd) {
    const chainInput = {
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
  await OraclesModel.create({
    chain: "OEC_FE",
    urls: ["https://exchaintmrpc.okex.org", "https://exchainrpc.okex.org/"],
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
    } else {
      hostsNotCreated.push(host);
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
      const port = isHarmony ? 9500 : Number(node.port);

      const nodeInput: INodeInput = {
        chain: (await ChainsModel.findOne({ name: node.chain.name }))._id,
        host: (await HostsModel.findOne({ name: hostName }))._id,
        haProxy: node.haProxy,
        port,
        loadBalancers: (
          await HostsModel.find({
            name: { $in: node.loadBalancers.map(({ name }) => name) },
          })
        ).map(({ _id }) => _id),
      };
      if (node.backend) nodeInput.backend = node.backend;
      if (node.server) nodeInput.server = node.server;

      if (!exists) {
        await new AutomationService().createNode(nodeInput, false);
        nodesCreated++;
        console.log(`Created ${nodesCreated} of ${nodesProd.length} nodes ...`);
      } else {
        nodesNotCreated.push(node);
      }
    } else {
      nodesNotCreated.push(node);
    }
  }
  console.log("Finished creating Nodes.");

  /* 6) Create Frontend Node Records */
  await new DiscordService().addWebhookForFrontendNode();

  const frontends = [
    { name: "poktmainnet", port: 18081, backend: "poktmainnet" },
    { name: "poktrpc", port: 18082, backend: "poktrpc" },
    { name: "avaxmainnet", port: 19650, backend: "avaxmainnet" },
    { name: "avaxtestnet", port: 19651, backend: "avaxtestnet" },
    { name: "bscmainnet", port: 18552, backend: "bscmainnet" },
    { name: "bsctestnet", port: 18559, backend: "bsctestnet" },
    { name: "fusemainnet", port: 18553, backend: "fusemainnet" },
    { name: "polymainnet", port: 18554, backend: "polymainnet" },
    { name: "polytestnet", port: 18558, backend: "polytestnet" },
    { name: "ethmainnet", port: 18545, backend: "ethmainnet" },
    { name: "ethropsten", port: 18557, backend: "ethropsten" },
    { name: "ethkovan", port: 18548, backend: "ethkovan" },
    { name: "ethrinkeby", port: 18555, backend: "ethrinkeby" },
    { name: "ethgoerli", port: 18556, backend: "ethgoerli" },
    { name: "daimainnet", port: 18546, backend: "daimainnet" },
    { name: "solanamainnet", port: 18899, backend: "solanamainnet" },
    { name: "algmainnet", port: 19999, backend: "algmainnet" },
    { name: "algtestnet", port: 19998, backend: "algtestnet" },
    { name: "hmy0", port: 19500, backend: "hmy0" },
    { name: "iotexmainnet", port: 18560, backend: "iotexmainnet" },
    { name: "evmtestnet", port: 18561, backend: "evmtestnet" },
    { name: "oecmainnet", port: 18562, backend: "oecmainnet" },
    { name: "bobamainnet", port: 18563, backend: "bobamainnet" },
  ];

  let frontendsCreated = 0;
  for await (const frontend of frontends) {
    let polyChainId: Types.ObjectId;
    let query: any;
    if (frontend.name === "polymainnet") {
      polyChainId = (await ChainsModel.findOne({ name: "POL", type: "EVM" }))._id;
      query = { chain: polyChainId, backend: frontend.backend };
    } else {
      query = { backend: frontend.backend };
    }

    const node = await NodesModel.findOne(query)
      .populate("host")
      .populate("loadBalancers")
      .exec();

    if (node) {
      for await (const loadBalancer of node.loadBalancers) {
        const url = loadBalancer.name.includes("shared-2")
          ? `shared-use${loadBalancer.name.split("-")[1]}.pocketblockchains.com`
          : `${loadBalancer.name}.pocketblockchains.com`;

        let chain: Types.ObjectId;
        if (frontend.name === "oecmainnet") {
          const oecQuery = { name: "OEC_FE", type: "EVM" };
          chain = (await ChainsModel.exists(oecQuery))
            ? (await ChainsModel.findOne(oecQuery))._id
            : (await ChainsModel.create(oecQuery))._id;
        } else {
          chain = (node.chain as unknown) as Types.ObjectId;
        }

        const nodeInput = {
          chain,
          host: loadBalancer.id,
          port: frontend.port,
          url: `http://${url}:${frontend.port}`,
          frontend: frontend.name,
          basicAuth: "pnfblockchains:UEnJdyW23ch92rf",
        };

        await NodesModel.create(nodeInput);

        frontendsCreated++;
        console.log(
          `Created ${frontendsCreated} of ${frontends.length * 2} frontend nodes ...`,
        );
      }
    } else {
      console.error(`No Node found for backend: ${frontend.backend}, skipping ...`);
    }
  }
  console.log("Finished creating frontend Nodes.");

  if (hostsNotCreated.length) {
    console.log(`Unable to create ${hostsNotCreated.length} hosts.`, { hostsNotCreated });
  }
  if (nodesNotCreated.length) {
    console.log(`Unable to create ${nodesNotCreated.length} nodes.`, { nodesNotCreated });
  }

  await disconnect();

  console.log("Fin.");
})();
