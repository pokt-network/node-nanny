import { ApolloServer, gql } from "apollo-server";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LogsModel,
  WebhookModel,
} from "@pokt-foundation/node-monitoring-core/dist/models";

const resolvers = {
  Query: {
    nodes: async () => await NodesModel.find({}).exec(),
    hosts: async (_, { loadBalancer }) => {
      const query = loadBalancer === true ? { loadBalancer } : {};
      return await HostsModel.find(query).sort({ name: 1 }).exec();
    },
    chains: async () => await ChainsModel.find({}).exec(),
    oracles: async () => await OraclesModel.find({}).exec(),
    logs: async ({ id }) => await LogsModel.find({ label: id }).exec(),
  },
  Mutation: {
    createChain: async (_, chain) => {
      return await ChainsModel.create(chain);
    },
    createHost: async (_, host) => {
      return await HostsModel.create(host);
    },
    createOracle: async (_, { chain, url }) => {
      const doesExist = await OraclesModel.findOne({ chain }).exec();
      if (!doesExist) {
        return await OraclesModel.create({ chain, urls: [url] });
      }
      return await OraclesModel.findOneAndUpdate({ chain }, { $push: { urls: url } }).exec();
    },
    createNode: async (_, { input }) => {
      return await NodesModel.create(input);
    },
    createWebhook: async (_, webhook) => {
      return await WebhookModel.create(webhook);
    },
  },

  Chain: {
    id(chain: any) {
      return chain._id;
    },
  },
  Host: {
    id(host: any) {
      return host._id;
    },
  },
};

const typeDefs = gql`
  type Chain {
    id: ID!
    name: String!
    type: String!
  }

  type Host {
    id: ID!
    name: String!
    ip: String!
    loadBalancer: Boolean!
    location: String!
  }

  type Node {
    id: ID
    backend: String
    chain: Chain
    haProxy: Boolean
    host: Host
    port: Int
    server: String
    url: String
    variance: Int
    ssl: Boolean
    basicAuth: String
    loadBalancers: [ID]
  }

  type Webhook {
    location: String
    chain: String
    url: String
  }

  input NodeInput {
    backend: String
    chain: ID
    haProxy: Boolean
    host: ID
    port: Int
    server: String
    url: String
    variance: Int
    ssl: Boolean
    basicAuth: String
    loadBalancers: [ID]
  }

  type Oracle {
    id: ID
    urls: [String]
  }

  type Log {
    id: ID
    timestamp: String
    level: String
    message: String
    label: ID
  }

  type Query {
    nodes: [Node]
    hosts(loadBalancer: Boolean): [Host]
    oracles: [Oracle]
    chains: [Chain]
    logs(id: String): [Log]
    haProxyStatus(id: String): String
    nodeStatus(id: String): String
  }

  type Mutation {
    createChain(name: String, type: String): Chain
    createHost(name: String, ip: String, loadBalancer: Boolean, location: String): Host
    createOracle(chain: String, url: String): Oracle
    createNode(input: NodeInput): Node
    updateNode(input: NodeInput): Node
    updatehost(name: String, ip: String): Host
    updateOracle(id: ID, action: String, url: String): Oracle
    updateChain(name: String, type: String): Chain
    updateNodeInRotation(id: ID, action: String): String
    deleteNode(id: ID): Node
    deletehost(id: ID): Host
    deleteOracle(id: ID): Oracle
    deleteChain(id: ID): Chain
    createWebhook(location: String, chain: String, url: String): Webhook
  }
`;

const server = new ApolloServer({ typeDefs, resolvers });

const run = async () => {
  await connect();
  const { url } = await server.listen();
  console.log(`🚀  Server ready at ${url}`);
};

run();
