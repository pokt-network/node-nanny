import { ApolloServer, gql } from "apollo-server";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LogsModel,
} from "@pokt-foundation/node-monitoring-core/dist/models";

const resolvers = {
  Query: {
    nodes: async () => await NodesModel.find({}).exec(),
    hosts: async () => await HostsModel.find({}).exec(),
    chains: async () => await ChainsModel.find({}).exec(),
    oracles: async () => await OraclesModel.find({}).exec(),
    logs: async ({ id }) => await LogsModel.find({ label: id }).exec(),
  },
};

const typeDefs = gql`
  type Chain {
    name: String
    type: String
  }

  type Host {
    name: String
    ip: String
  }

  type Node {
    id: ID
    backend: String
    chain: Chain
    haProxy: Boolean
    hasPeer: Boolean
    host: Host
    port: Int
    server: String
    threshold: Int
    url: String
    variance: Int
    logGroup: String
  }

  input NodeInput {
    backend: String
    chain: ID
    haProxy: Boolean
    hasPeer: Boolean
    host: ID
    port: Int
    server: String
    threshold: Int
    url: String
    variance: Int
    logGroup: String
  }

  type Oracle {
    id: ID
    urls: [String]
  }

  type Haproxy {
    id: ID
    name: String
    ip: String
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
    hosts: [Host]
    oracles: [Oracle]
    chains: [Chain]
    logs(id: String): [Log]
    haProxyStatus(id: String): String
    nodeStatus(id: String): String
  }

  type Mutation {
    createNode(input: NodeInput): Node
    createhost(name: String, ip: String): Host
    createOracle(chain: String, url: String): Oracle
    createChain(name: String, type: String): Chain
    updateNode(input: NodeInput): Node
    updatehost(name: String, ip: String): Host
    updateOracle(id: ID, action: String, url: String): Oracle
    updateChain(name: String, type: String): Chain
    updateNodeInRotation(id: ID, action: String): String
    deleteNode(id: ID): Node
    deletehost(id: ID): Host
    deleteOracle(id: ID): Oracle
    deleteChain(id: ID): Chain
  }
`;

const server = new ApolloServer({ typeDefs, resolvers });

const run = async () => {
  await connect();
  const { url } = await server.listen();
  console.log(`🚀  Server ready at ${url}`);
};

run();
