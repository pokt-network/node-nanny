import { gql } from "apollo-server";

const typeDefs = gql`
  # Types
  type Chain {
    id: ID!
    name: String!
    type: String!
    allowance: Int
  }

  type Host {
    id: ID!
    name: String!
    loadBalancer: Boolean!
    location: String!
    ip: String
    fqdn: String
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

  type PaginatedLogs {
    docs: [Log!]!
    totalDocs: Int!
    limit: Int!
    totalPages: Int!
    page: Int!
    pagingCounter: Int!
    hasPrevPage: Boolean!
    hasNextPage: Boolean!
    prevPage: Int
    nextPage: Int
  }

  type Node {
    id: ID!
    chain: Chain!
    host: Host!
    port: Int!
    url: String!
    muted: Boolean!
    status: String!
    conditions: String!
    loadBalancers: [ID!]
    backend: String
    frontend: String
    server: String
    ssl: Boolean
    haProxy: Boolean
    dispatch: Boolean
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
    location: String!
  }

  # Inputs
  input NodeInput {
    chain: ID!
    host: ID!
    port: Int!
    loadBalancers: [ID!]!
    haProxy: Boolean!
    backend: String
    server: String
  }

  input NodeCSVInput {
    chain: String!
    host: String!
    loadBalancers: [String!]!
    port: Int!
    haProxy: Boolean!
    backend: String
    server: String
  }

  input HostCSVInput {
    name: String!
    location: String!
    loadBalancer: Boolean
    fqdn: String
    ip: String
  }

  # Resolvers
  type Query {
    chains: [Chain!]!
    hosts(loadBalancer: Boolean): [Host!]!
    locations: [Location!]!
    node(id: ID!): Node!
    nodes: [Node!]!
    oracles: [Oracle!]!
    webhooks: [Webhook!]!

    logs(
      nodeIds: [ID!]!
      page: Int!
      limit: Int!
      startDate: String
      endDate: String
    ): PaginatedLogs!

    getHaProxyStatus(id: ID!): Int!
    nodeStatus(id: String): String!
  }

  type Mutation {
    createHost(
      location: String!
      name: String!
      ip: String
      fqdn: String
      loadBalancer: Boolean!
    ): Host
    createNode(input: NodeInput): Node
    createNodesCSV(nodes: [NodeCSVInput!]!): [Node]!
    createHostsCSV(hosts: [HostCSVInput!]!): [Host]!

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
  }
`;

export default typeDefs;
