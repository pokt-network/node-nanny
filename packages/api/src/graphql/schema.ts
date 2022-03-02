import { gql } from "apollo-server";

const typeDefs = gql`
  # Types
  type Chain {
    id: ID!
    name: String!
    type: String!
    variance: Int
  }

  type Host {
    id: ID!
    name: String!
    ip: String!
    loadBalancer: Boolean!
    location: String
  }

  type Location {
    id: ID!
    name: String!
  }

  type Log {
    id: ID!
    timestamp: String!
    level: String!
    message: String!
    label: ID!
  }

  type Node {
    id: ID!
    chain: Chain!
    host: Host!
    haProxy: Boolean!
    port: Int!
    url: String!
    muted: Boolean!
    loadBalancers: [ID]
    backend: String
    server: String
    ssl: Boolean
  }

  # EVM chains only
  type Oracle {
    id: ID!
    chain: String!
    urls: [String]
  }

  type Webhook {
    id: ID!
    chain: String!
    url: String!
    location: String
  }

  # Inputs
  input NodeInput {
    backend: String
    chain: ID
    host: ID
    haProxy: Boolean
    port: Int
    server: String
    url: String
    variance: Int
    ssl: Boolean
    loadBalancers: [ID]
  }

  # Resolvers
  type Query {
    chains: [Chain!]!
    hosts(loadBalancer: Boolean): [Host!]!
    locations: [Location!]!
    logs(id: String): [Log!]!
    node(id: ID!): Node!
    nodes: [Node!]!
    oracles: [Oracle!]!
    webhooks: [Webhook!]!

    getHaProxyStatus(id: ID!): Int!
    nodeStatus(id: String): String!
  }

  type Mutation {
    createChain(name: String, type: String, variance: Int): Chain
    createHost(name: String, ip: String, loadBalancer: Boolean, location: String): Host
    createNode(input: NodeInput): Node
    createOracle(chain: String, url: String): Oracle
    createWebhook(location: String, chain: String, url: String): Webhook

    updateNode(input: NodeInput): Node
    updateHost(name: String, ip: String): Host
    updateOracle(id: ID, action: String, url: String): Oracle
    updateChain(name: String, type: String): Chain
    updateNodeInRotation(id: ID, action: String): String

    deleteNode(id: ID): Node
    deleteHost(id: ID): Host
    deleteOracle(id: ID): Oracle
    deleteChain(id: ID): Chain

    muteMonitor(id: ID!): Node!
    unmuteMonitor(id: ID!): Node!
    enableHaProxyServer(id: ID!): Boolean!
    disableHaProxyServer(id: ID!): Boolean!
    rebootServer(id: ID!): String!
  }
`;

export default typeDefs;
