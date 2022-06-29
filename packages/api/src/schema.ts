import { gql } from 'apollo-server';

const typeDefs = gql`
  # Types
  type Chain {
    id: ID!
    name: String!
    type: String!
    chainId: String!
    allowance: Int!
    hasOwnEndpoint: Boolean!
    useOracles: Boolean!
    responsePath: String!
    rpc: String
    endpoint: String
    healthyValue: String
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
    automation: Boolean
    dispatch: Boolean
    basicAuth: String
    deltaArray: [Int]
    erroredAt: String
  }

  type ServerCount {
    online: Int!
    total: Int!
  }

  type HealthCheck {
    height: BlockHeight
    details: HealthResponseDetails
    node: Node
    error: String
  }

  type BlockHeight {
    internalHeight: Int!
    delta: Int
    externalHeight: Int
  }

  type HealthResponseDetails {
    noOracle: Boolean
    badOracles: [String]
    nodeIsAheadOfPeer: Boolean
    secondsToRecover: Int
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
    url: String!
    port: String!
    loadBalancers: [ID!]!
    automation: Boolean!
    backend: String
    frontend: String
    server: String
    basicAuth: String
    dispatch: Boolean
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
    port: String!
    automation: Boolean!
    backend: String
    loadBalancers: [String!]!
    server: String
    basicAuth: String
  }

  input HostCSVInput {
    name: String!
    location: String!
    loadBalancer: Boolean
    fqdn: String
    ip: String
  }

  input ChainInput {
    name: String!
    type: String!
    chainId: String!
    allowance: Int!
    hasOwnEndpoint: Boolean!
    useOracles: Boolean!
    responsePath: String!
    rpc: String
    endpoint: String
    healthyValue: String
  }

  input NodeUpdate {
    id: ID!
    chain: ID
    host: ID
    name: String
    url: String
    loadBalancers: [ID]
    port: String
    automation: Boolean
    backend: String
    frontend: String
    server: String
    https: Boolean
    dispatch: Boolean
    basicAuth: String
  }

  input HostUpdate {
    id: ID!
    name: String
    location: ID
    loadBalancer: Boolean
    ip: String
    fqdn: String
  }

  input ChainUpdate {
    id: ID!
    name: String
    type: String
    chainId: String
    allowance: Int
    hasOwnEndpoint: Boolean
    useOracles: Boolean
    responsePath: String
    rpc: String
    endpoint: String
    healthyValue: String
  }

  input OracleUpdate {
    chain: String!
    urls: [String!]!
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
    checkValidHaProxy(input: NodeInput!): Boolean!
    nodeStatus(id: ID!): String!
    getServerCount(id: ID!): ServerCount!
    getHealthCheck(id: ID!): HealthCheck!
  }

  type Mutation {
    createHost(input: HostInput!): Host
    createHostsCSV(hosts: [HostCSVInput!]!): [Host]!
    createLocation(name: String!): Location!
    createNode(input: NodeInput!): Node
    createNodesCSV(nodes: [NodeCSVInput!]!): [Node]!

    updateHost(update: HostUpdate!): Host
    updateNode(update: NodeUpdate!): Node

    updateChain(update: ChainUpdate!): Chain
    updateOracle(update: OracleUpdate!): Oracle

    deleteHost(id: ID!): Host
    deleteLocation(id: ID!): Location
    deleteNode(id: ID!): Node

    muteMonitor(id: ID!): Node!
    unmuteMonitor(id: ID!): Node!
    enableHaProxyServer(id: ID!): Boolean!
    disableHaProxyServer(id: ID!): Boolean!
  }
`;

export default typeDefs;
