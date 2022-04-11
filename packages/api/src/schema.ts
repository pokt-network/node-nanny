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
    location: Location!
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

  type LogForChart {
    timestamp: String!
    ok: Int!
    error: Int!
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
    name: String!
    url: String!
    muted: Boolean!
    status: String!
    conditions: String!
    loadBalancers: [Host!]
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
    https: Boolean!
    chain: ID!
    host: ID!
    name: String!
    port: Int!
    loadBalancers: [ID!]!
    haProxy: Boolean!
    backend: String
    server: String
  }

  input HostInput {
    name: String!
    location: ID!
    loadBalancer: Boolean!
    ip: String
    fqdn: String
  }

  input NodeCSVInput {
    https: Boolean!
    chain: String!
    host: String!
    name: String!
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

  input NodeUpdate {
    id: ID!
    chain: ID
    host: ID
    name: String
    loadBalancers: [ID]
    port: Int
    haProxy: Boolean
    backend: String
    frontend: String
    server: String
  }

  input HostUpdate {
    id: ID!
    name: String
    location: ID
    loadBalancer: Boolean
    ip: String
    fqdn: String
  }

  input LogParams {
    nodeIds: [ID!]!
    page: Int!
    limit: Int!
    startDate: String
    endDate: String
  }

  input LogChartParams {
    startDate: String!
    endDate: String!
    increment: Int!
    nodeIds: [ID!]
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

    logs(input: LogParams!): PaginatedLogs!
    logsForChart(input: LogChartParams!): [LogForChart!]!

    getHaProxyStatus(id: ID!): Int!
    nodeStatus(id: String): String!
  }

  type Mutation {
    createHost(input: HostInput!): Host
    createHostsCSV(hosts: [HostCSVInput!]!): [Host]!
    createNode(input: NodeInput!): Node
    createNodesCSV(nodes: [NodeCSVInput!]!): [Node]!

    updateHost(update: HostUpdate!): Host
    updateNode(update: NodeUpdate!): Node

    deleteHost(id: ID!): Host
    deleteNode(id: ID!): Node

    muteMonitor(id: ID!): Node!
    unmuteMonitor(id: ID!): Node!
    enableHaProxyServer(id: ID!): Boolean!
    disableHaProxyServer(id: ID!): Boolean!
  }
`;

export default typeDefs;
