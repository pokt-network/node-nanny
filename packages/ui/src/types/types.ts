import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type IBlockHeight = {
  delta?: Maybe<Scalars['Int']>;
  externalHeight?: Maybe<Scalars['Int']>;
  internalHeight: Scalars['Int'];
};

export type IChain = {
  allowance: Scalars['Int'];
  chainId: Scalars['String'];
  endpoint?: Maybe<Scalars['String']>;
  hasOwnEndpoint: Scalars['Boolean'];
  healthyValue?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  responsePath: Scalars['String'];
  rpc?: Maybe<Scalars['String']>;
  type: Scalars['String'];
  useOracles: Scalars['Boolean'];
};

export type IChainInput = {
  allowance: Scalars['Int'];
  chainId: Scalars['String'];
  endpoint?: InputMaybe<Scalars['String']>;
  hasOwnEndpoint: Scalars['Boolean'];
  healthyValue?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  responsePath: Scalars['String'];
  rpc?: InputMaybe<Scalars['String']>;
  type: Scalars['String'];
  useOracles: Scalars['Boolean'];
};

export type IChainUpdate = {
  allowance?: InputMaybe<Scalars['Int']>;
  chainId?: InputMaybe<Scalars['String']>;
  endpoint?: InputMaybe<Scalars['String']>;
  hasOwnEndpoint?: InputMaybe<Scalars['Boolean']>;
  healthyValue?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  responsePath?: InputMaybe<Scalars['String']>;
  rpc?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
  useOracles?: InputMaybe<Scalars['Boolean']>;
};

export type IHealthCheck = {
  details?: Maybe<IHealthResponseDetails>;
  error?: Maybe<Scalars['String']>;
  height?: Maybe<IBlockHeight>;
  node?: Maybe<INode>;
};

export type IHealthResponseDetails = {
  badOracles?: Maybe<Array<Maybe<Scalars['String']>>>;
  noOracle?: Maybe<Scalars['Boolean']>;
  nodeIsAheadOfPeer?: Maybe<Scalars['Boolean']>;
  secondsToRecover?: Maybe<Scalars['Int']>;
};

export type IHost = {
  fqdn?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  ip?: Maybe<Scalars['String']>;
  loadBalancer: Scalars['Boolean'];
  location: ILocation;
  name: Scalars['String'];
};

export type IHostCsvInput = {
  fqdn?: InputMaybe<Scalars['String']>;
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
  location: Scalars['String'];
  name: Scalars['String'];
};

export type IHostInput = {
  fqdn?: InputMaybe<Scalars['String']>;
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer: Scalars['Boolean'];
  location: Scalars['ID'];
  name: Scalars['String'];
};

export type IHostUpdate = {
  fqdn?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
  location?: InputMaybe<Scalars['ID']>;
  name?: InputMaybe<Scalars['String']>;
};

export type ILocation = {
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type ILog = {
  id: Scalars['ID'];
  label: Scalars['ID'];
  level: Scalars['String'];
  message: Scalars['String'];
  timestamp: Scalars['String'];
};

export type ILogChartParams = {
  endDate: Scalars['String'];
  increment: Scalars['Int'];
  nodeIds?: InputMaybe<Array<Scalars['ID']>>;
  startDate: Scalars['String'];
};

export type ILogForChart = {
  error: Scalars['Int'];
  ok: Scalars['Int'];
  timestamp: Scalars['String'];
};

export type ILogParams = {
  endDate?: InputMaybe<Scalars['String']>;
  limit: Scalars['Int'];
  nodeIds: Array<Scalars['ID']>;
  page: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};

export type IMutation = {
  createHost?: Maybe<IHost>;
  createHostsCSV: Array<Maybe<IHost>>;
  createLocation: ILocation;
  createNode?: Maybe<INode>;
  createNodesCSV: Array<Maybe<INode>>;
  deleteHost?: Maybe<IHost>;
  deleteLocation?: Maybe<ILocation>;
  deleteNode?: Maybe<INode>;
  disableHaProxyServer: Scalars['Boolean'];
  enableHaProxyServer: Scalars['Boolean'];
  muteMonitor: INode;
  unmuteMonitor: INode;
  updateChain?: Maybe<IChain>;
  updateHost?: Maybe<IHost>;
  updateNode?: Maybe<INode>;
  updateOracle?: Maybe<IOracle>;
};


export type IMutationCreateHostArgs = {
  input: IHostInput;
};


export type IMutationCreateHostsCsvArgs = {
  hosts: Array<IHostCsvInput>;
};


export type IMutationCreateLocationArgs = {
  name: Scalars['String'];
};


export type IMutationCreateNodeArgs = {
  input: INodeInput;
};


export type IMutationCreateNodesCsvArgs = {
  nodes: Array<INodeCsvInput>;
};


export type IMutationDeleteHostArgs = {
  id: Scalars['ID'];
};


export type IMutationDeleteLocationArgs = {
  id: Scalars['ID'];
};


export type IMutationDeleteNodeArgs = {
  id: Scalars['ID'];
};


export type IMutationDisableHaProxyServerArgs = {
  id: Scalars['ID'];
};


export type IMutationEnableHaProxyServerArgs = {
  id: Scalars['ID'];
};


export type IMutationMuteMonitorArgs = {
  id: Scalars['ID'];
};


export type IMutationUnmuteMonitorArgs = {
  id: Scalars['ID'];
};


export type IMutationUpdateChainArgs = {
  update: IChainUpdate;
};


export type IMutationUpdateHostArgs = {
  update: IHostUpdate;
};


export type IMutationUpdateNodeArgs = {
  update: INodeUpdate;
};


export type IMutationUpdateOracleArgs = {
  update: IOracleUpdate;
};

export type INode = {
  automation?: Maybe<Scalars['Boolean']>;
  backend?: Maybe<Scalars['String']>;
  basicAuth?: Maybe<Scalars['String']>;
  chain: IChain;
  conditions: Scalars['String'];
  deltaArray?: Maybe<Array<Maybe<Scalars['Int']>>>;
  dispatch?: Maybe<Scalars['Boolean']>;
  erroredAt?: Maybe<Scalars['String']>;
  frontend?: Maybe<Scalars['String']>;
  host: IHost;
  id: Scalars['ID'];
  loadBalancers?: Maybe<Array<IHost>>;
  muted: Scalars['Boolean'];
  name: Scalars['String'];
  port: Scalars['Int'];
  server?: Maybe<Scalars['String']>;
  ssl?: Maybe<Scalars['Boolean']>;
  status: Scalars['String'];
  url: Scalars['String'];
};

export type INodeCsvInput = {
  automation: Scalars['Boolean'];
  backend?: InputMaybe<Scalars['String']>;
  basicAuth?: InputMaybe<Scalars['String']>;
  chain: Scalars['String'];
  host: Scalars['String'];
  https: Scalars['Boolean'];
  loadBalancers: Array<Scalars['String']>;
  name: Scalars['String'];
  port: Scalars['String'];
  server?: InputMaybe<Scalars['String']>;
};

export type INodeInput = {
  automation: Scalars['Boolean'];
  backend?: InputMaybe<Scalars['String']>;
  basicAuth?: InputMaybe<Scalars['String']>;
  chain: Scalars['ID'];
  dispatch?: InputMaybe<Scalars['Boolean']>;
  frontend?: InputMaybe<Scalars['String']>;
  host: Scalars['ID'];
  https: Scalars['Boolean'];
  loadBalancers: Array<Scalars['ID']>;
  name: Scalars['String'];
  port: Scalars['String'];
  server?: InputMaybe<Scalars['String']>;
  url: Scalars['String'];
};

export type INodeUpdate = {
  automation?: InputMaybe<Scalars['Boolean']>;
  backend?: InputMaybe<Scalars['String']>;
  basicAuth?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Scalars['ID']>;
  dispatch?: InputMaybe<Scalars['Boolean']>;
  frontend?: InputMaybe<Scalars['String']>;
  host?: InputMaybe<Scalars['ID']>;
  https?: InputMaybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  loadBalancers?: InputMaybe<Array<InputMaybe<Scalars['ID']>>>;
  name?: InputMaybe<Scalars['String']>;
  port?: InputMaybe<Scalars['String']>;
  server?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};

export type IOracle = {
  chain: Scalars['String'];
  id: Scalars['ID'];
  urls?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type IOracleUpdate = {
  chain: Scalars['String'];
  urls: Array<Scalars['String']>;
};

export type IPaginatedLogs = {
  docs: Array<ILog>;
  hasNextPage: Scalars['Boolean'];
  hasPrevPage: Scalars['Boolean'];
  limit: Scalars['Int'];
  nextPage?: Maybe<Scalars['Int']>;
  page: Scalars['Int'];
  pagingCounter: Scalars['Int'];
  prevPage?: Maybe<Scalars['Int']>;
  totalDocs: Scalars['Int'];
  totalPages: Scalars['Int'];
};

export type IQuery = {
  chains: Array<IChain>;
  checkValidHaProxy: Scalars['Boolean'];
  getHaProxyStatus: Scalars['Int'];
  getHealthCheck: IHealthCheck;
  getServerCount: IServerCount;
  hosts: Array<IHost>;
  locations: Array<ILocation>;
  logs: IPaginatedLogs;
  logsForChart: Array<ILogForChart>;
  node: INode;
  nodeStatus: Scalars['String'];
  nodes: Array<INode>;
  oracles: Array<IOracle>;
  webhooks: Array<IWebhook>;
};


export type IQueryCheckValidHaProxyArgs = {
  input: INodeInput;
};


export type IQueryGetHaProxyStatusArgs = {
  id: Scalars['ID'];
};


export type IQueryGetHealthCheckArgs = {
  id: Scalars['ID'];
};


export type IQueryGetServerCountArgs = {
  id: Scalars['ID'];
};


export type IQueryHostsArgs = {
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
};


export type IQueryLogsArgs = {
  input: ILogParams;
};


export type IQueryLogsForChartArgs = {
  input: ILogChartParams;
};


export type IQueryNodeArgs = {
  id: Scalars['ID'];
};


export type IQueryNodeStatusArgs = {
  id: Scalars['ID'];
};

export type IServerCount = {
  online: Scalars['Int'];
  total: Scalars['Int'];
};

export type IWebhook = {
  chain: Scalars['String'];
  id: Scalars['ID'];
  location: Scalars['String'];
  url: Scalars['String'];
};

export type ICreateHostMutationVariables = Exact<{
  input: IHostInput;
}>;


export type ICreateHostMutation = { createHost?: { id: string, name: string, ip?: string | null, fqdn?: string | null, loadBalancer: boolean, location: { id: string, name: string } } | null };

export type ICreateHostsCsvMutationVariables = Exact<{
  hosts: Array<IHostCsvInput> | IHostCsvInput;
}>;


export type ICreateHostsCsvMutation = { createHostsCSV: Array<{ id: string } | null> };

export type ICreateLocationMutationVariables = Exact<{
  name: Scalars['String'];
}>;


export type ICreateLocationMutation = { createLocation: { name: string } };

export type ICreateNodeMutationVariables = Exact<{
  input: INodeInput;
}>;


export type ICreateNodeMutation = { createNode?: { id: string, backend?: string | null, frontend?: string | null, port: number, name: string, server?: string | null, url: string, muted: boolean, status: string, conditions: string, automation?: boolean | null, dispatch?: boolean | null, loadBalancers?: Array<{ id: string, name: string }> | null, chain: { id: string, name: string, type: string }, host: { id: string, name: string } } | null };

export type ICreateNodesCsvMutationVariables = Exact<{
  nodes: Array<INodeCsvInput> | INodeCsvInput;
}>;


export type ICreateNodesCsvMutation = { createNodesCSV: Array<{ id: string } | null> };

export type IUpdateHostMutationVariables = Exact<{
  update: IHostUpdate;
}>;


export type IUpdateHostMutation = { updateHost?: { id: string, name: string, ip?: string | null, fqdn?: string | null, loadBalancer: boolean, location: { id: string, name: string } } | null };

export type IUpdateNodeMutationVariables = Exact<{
  update: INodeUpdate;
}>;


export type IUpdateNodeMutation = { updateNode?: { id: string, backend?: string | null, frontend?: string | null, port: number, name: string, server?: string | null, url: string, muted: boolean, status: string, conditions: string, automation?: boolean | null, dispatch?: boolean | null, basicAuth?: string | null, loadBalancers?: Array<{ id: string, name: string }> | null, chain: { id: string, name: string, type: string }, host: { id: string, name: string } } | null };

export type IUpdateChainMutationVariables = Exact<{
  update: IChainUpdate;
}>;


export type IUpdateChainMutation = { updateChain?: { name: string, type: string, allowance: number, chainId: string, hasOwnEndpoint: boolean, useOracles: boolean, responsePath: string, rpc?: string | null, endpoint?: string | null, healthyValue?: string | null } | null };

export type IUpdateOracleMutationVariables = Exact<{
  update: IOracleUpdate;
}>;


export type IUpdateOracleMutation = { updateOracle?: { chain: string, urls?: Array<string | null> | null } | null };

export type IDeleteHostMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IDeleteHostMutation = { deleteHost?: { id: string, name: string } | null };

export type IDeleteLocationMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IDeleteLocationMutation = { deleteLocation?: { id: string, name: string } | null };

export type IDeleteNodeMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IDeleteNodeMutation = { deleteNode?: { id: string, name: string } | null };

export type IMuteMonitorMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IMuteMonitorMutation = { muteMonitor: { id: string, muted: boolean, name: string } };

export type IUnmuteMonitorMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IUnmuteMonitorMutation = { unmuteMonitor: { id: string, muted: boolean, name: string } };

export type IEnableHaProxyServerMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IEnableHaProxyServerMutation = { enableHaProxyServer: boolean };

export type IDisableHaProxyServerMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IDisableHaProxyServerMutation = { disableHaProxyServer: boolean };

export type IChainsQueryVariables = Exact<{ [key: string]: never; }>;


export type IChainsQuery = { chains: Array<{ id: string, name: string, type: string, chainId: string, allowance: number, hasOwnEndpoint: boolean, useOracles: boolean, responsePath: string, rpc?: string | null, endpoint?: string | null, healthyValue?: string | null }> };

export type IHostsQueryVariables = Exact<{ [key: string]: never; }>;


export type IHostsQuery = { hosts: Array<{ id: string, name: string, ip?: string | null, fqdn?: string | null, loadBalancer: boolean, location: { id: string, name: string } }> };

export type ILocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type ILocationsQuery = { locations: Array<{ id: string, name: string }> };

export type INodeQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type INodeQuery = { node: { id: string, backend?: string | null, frontend?: string | null, port: number, name: string, server?: string | null, url: string, muted: boolean, status: string, conditions: string, automation?: boolean | null, dispatch?: boolean | null, basicAuth?: string | null, erroredAt?: string | null, loadBalancers?: Array<{ id: string, name: string }> | null, chain: { id: string, name: string, type: string, allowance: number, chainId: string, hasOwnEndpoint: boolean, useOracles: boolean, responsePath: string, rpc?: string | null, endpoint?: string | null, healthyValue?: string | null }, host: { id: string, name: string } } };

export type INodesQueryVariables = Exact<{ [key: string]: never; }>;


export type INodesQuery = { nodes: Array<{ id: string, backend?: string | null, frontend?: string | null, port: number, name: string, server?: string | null, url: string, muted: boolean, status: string, conditions: string, automation?: boolean | null, dispatch?: boolean | null, basicAuth?: string | null, erroredAt?: string | null, loadBalancers?: Array<{ id: string, name: string }> | null, chain: { id: string, name: string, type: string, allowance: number, chainId: string, hasOwnEndpoint: boolean, useOracles: boolean, responsePath: string, rpc?: string | null, endpoint?: string | null, healthyValue?: string | null }, host: { id: string, name: string } }> };

export type ILogsQueryVariables = Exact<{
  input: ILogParams;
}>;


export type ILogsQuery = { logs: { totalDocs: number, page: number, hasPrevPage: boolean, hasNextPage: boolean, docs: Array<{ message: string, level: string, timestamp: string }> } };

export type ILogsForChartQueryVariables = Exact<{
  input: ILogChartParams;
}>;


export type ILogsForChartQuery = { logsForChart: Array<{ timestamp: string, ok: number, error: number }> };

export type IOraclesQueryVariables = Exact<{ [key: string]: never; }>;


export type IOraclesQuery = { oracles: Array<{ id: string, chain: string, urls?: Array<string | null> | null }> };

export type IWebhooksQueryVariables = Exact<{ [key: string]: never; }>;


export type IWebhooksQuery = { webhooks: Array<{ id: string, location: string, chain: string, url: string }> };

export type IGetHostsChainsAndLoadBalancersQueryVariables = Exact<{ [key: string]: never; }>;


export type IGetHostsChainsAndLoadBalancersQuery = { hosts: Array<{ id: string, name: string, ip?: string | null, fqdn?: string | null, location: { id: string, name: string } }>, chains: Array<{ id: string, name: string, type: string, allowance: number, chainId: string, hasOwnEndpoint: boolean, useOracles: boolean, responsePath: string, rpc?: string | null, endpoint?: string | null, healthyValue?: string | null }>, loadBalancers: Array<{ id: string, name: string, ip?: string | null, fqdn?: string | null, location: { id: string, name: string } }> };

export type IGetNodeStatusQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IGetNodeStatusQuery = { haProxyStatus: number };

export type ICheckValidHaProxyQueryVariables = Exact<{
  input: INodeInput;
}>;


export type ICheckValidHaProxyQuery = { validHaProxy: boolean };

export type IGetServerCountQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IGetServerCountQuery = { serverCount: { online: number, total: number } };

export type IGetHealthCheckQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IGetHealthCheckQuery = { healthCheck: { error?: string | null, height?: { internalHeight: number, delta?: number | null, externalHeight?: number | null } | null, details?: { noOracle?: boolean | null, badOracles?: Array<string | null> | null, nodeIsAheadOfPeer?: boolean | null, secondsToRecover?: number | null } | null, node?: { status: string, conditions: string, deltaArray?: Array<number | null> | null } | null } };


export const CreateHostDocument = gql`
    mutation CreateHost($input: HostInput!) {
  createHost(input: $input) {
    id
    name
    ip
    fqdn
    loadBalancer
    location {
      id
      name
    }
  }
}
    `;
export type ICreateHostMutationFn = Apollo.MutationFunction<ICreateHostMutation, ICreateHostMutationVariables>;

/**
 * __useCreateHostMutation__
 *
 * To run a mutation, you first call `useCreateHostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHostMutation, { data, loading, error }] = useCreateHostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateHostMutation(baseOptions?: Apollo.MutationHookOptions<ICreateHostMutation, ICreateHostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ICreateHostMutation, ICreateHostMutationVariables>(CreateHostDocument, options);
      }
export type CreateHostMutationHookResult = ReturnType<typeof useCreateHostMutation>;
export type CreateHostMutationResult = Apollo.MutationResult<ICreateHostMutation>;
export type CreateHostMutationOptions = Apollo.BaseMutationOptions<ICreateHostMutation, ICreateHostMutationVariables>;
export const CreateHostsCsvDocument = gql`
    mutation CreateHostsCSV($hosts: [HostCSVInput!]!) {
  createHostsCSV(hosts: $hosts) {
    id
  }
}
    `;
export type ICreateHostsCsvMutationFn = Apollo.MutationFunction<ICreateHostsCsvMutation, ICreateHostsCsvMutationVariables>;

/**
 * __useCreateHostsCsvMutation__
 *
 * To run a mutation, you first call `useCreateHostsCsvMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHostsCsvMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHostsCsvMutation, { data, loading, error }] = useCreateHostsCsvMutation({
 *   variables: {
 *      hosts: // value for 'hosts'
 *   },
 * });
 */
export function useCreateHostsCsvMutation(baseOptions?: Apollo.MutationHookOptions<ICreateHostsCsvMutation, ICreateHostsCsvMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ICreateHostsCsvMutation, ICreateHostsCsvMutationVariables>(CreateHostsCsvDocument, options);
      }
export type CreateHostsCsvMutationHookResult = ReturnType<typeof useCreateHostsCsvMutation>;
export type CreateHostsCsvMutationResult = Apollo.MutationResult<ICreateHostsCsvMutation>;
export type CreateHostsCsvMutationOptions = Apollo.BaseMutationOptions<ICreateHostsCsvMutation, ICreateHostsCsvMutationVariables>;
export const CreateLocationDocument = gql`
    mutation CreateLocation($name: String!) {
  createLocation(name: $name) {
    name
  }
}
    `;
export type ICreateLocationMutationFn = Apollo.MutationFunction<ICreateLocationMutation, ICreateLocationMutationVariables>;

/**
 * __useCreateLocationMutation__
 *
 * To run a mutation, you first call `useCreateLocationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLocationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLocationMutation, { data, loading, error }] = useCreateLocationMutation({
 *   variables: {
 *      name: // value for 'name'
 *   },
 * });
 */
export function useCreateLocationMutation(baseOptions?: Apollo.MutationHookOptions<ICreateLocationMutation, ICreateLocationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ICreateLocationMutation, ICreateLocationMutationVariables>(CreateLocationDocument, options);
      }
export type CreateLocationMutationHookResult = ReturnType<typeof useCreateLocationMutation>;
export type CreateLocationMutationResult = Apollo.MutationResult<ICreateLocationMutation>;
export type CreateLocationMutationOptions = Apollo.BaseMutationOptions<ICreateLocationMutation, ICreateLocationMutationVariables>;
export const CreateNodeDocument = gql`
    mutation CreateNode($input: NodeInput!) {
  createNode(input: $input) {
    id
    backend
    frontend
    port
    name
    server
    url
    muted
    status
    conditions
    loadBalancers {
      id
      name
    }
    automation
    dispatch
    chain {
      id
      name
      type
    }
    host {
      id
      name
    }
  }
}
    `;
export type ICreateNodeMutationFn = Apollo.MutationFunction<ICreateNodeMutation, ICreateNodeMutationVariables>;

/**
 * __useCreateNodeMutation__
 *
 * To run a mutation, you first call `useCreateNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNodeMutation, { data, loading, error }] = useCreateNodeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateNodeMutation(baseOptions?: Apollo.MutationHookOptions<ICreateNodeMutation, ICreateNodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ICreateNodeMutation, ICreateNodeMutationVariables>(CreateNodeDocument, options);
      }
export type CreateNodeMutationHookResult = ReturnType<typeof useCreateNodeMutation>;
export type CreateNodeMutationResult = Apollo.MutationResult<ICreateNodeMutation>;
export type CreateNodeMutationOptions = Apollo.BaseMutationOptions<ICreateNodeMutation, ICreateNodeMutationVariables>;
export const CreateNodesCsvDocument = gql`
    mutation CreateNodesCSV($nodes: [NodeCSVInput!]!) {
  createNodesCSV(nodes: $nodes) {
    id
  }
}
    `;
export type ICreateNodesCsvMutationFn = Apollo.MutationFunction<ICreateNodesCsvMutation, ICreateNodesCsvMutationVariables>;

/**
 * __useCreateNodesCsvMutation__
 *
 * To run a mutation, you first call `useCreateNodesCsvMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNodesCsvMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNodesCsvMutation, { data, loading, error }] = useCreateNodesCsvMutation({
 *   variables: {
 *      nodes: // value for 'nodes'
 *   },
 * });
 */
export function useCreateNodesCsvMutation(baseOptions?: Apollo.MutationHookOptions<ICreateNodesCsvMutation, ICreateNodesCsvMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ICreateNodesCsvMutation, ICreateNodesCsvMutationVariables>(CreateNodesCsvDocument, options);
      }
export type CreateNodesCsvMutationHookResult = ReturnType<typeof useCreateNodesCsvMutation>;
export type CreateNodesCsvMutationResult = Apollo.MutationResult<ICreateNodesCsvMutation>;
export type CreateNodesCsvMutationOptions = Apollo.BaseMutationOptions<ICreateNodesCsvMutation, ICreateNodesCsvMutationVariables>;
export const UpdateHostDocument = gql`
    mutation UpdateHost($update: HostUpdate!) {
  updateHost(update: $update) {
    id
    name
    ip
    fqdn
    loadBalancer
    location {
      id
      name
    }
  }
}
    `;
export type IUpdateHostMutationFn = Apollo.MutationFunction<IUpdateHostMutation, IUpdateHostMutationVariables>;

/**
 * __useUpdateHostMutation__
 *
 * To run a mutation, you first call `useUpdateHostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateHostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateHostMutation, { data, loading, error }] = useUpdateHostMutation({
 *   variables: {
 *      update: // value for 'update'
 *   },
 * });
 */
export function useUpdateHostMutation(baseOptions?: Apollo.MutationHookOptions<IUpdateHostMutation, IUpdateHostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IUpdateHostMutation, IUpdateHostMutationVariables>(UpdateHostDocument, options);
      }
export type UpdateHostMutationHookResult = ReturnType<typeof useUpdateHostMutation>;
export type UpdateHostMutationResult = Apollo.MutationResult<IUpdateHostMutation>;
export type UpdateHostMutationOptions = Apollo.BaseMutationOptions<IUpdateHostMutation, IUpdateHostMutationVariables>;
export const UpdateNodeDocument = gql`
    mutation UpdateNode($update: NodeUpdate!) {
  updateNode(update: $update) {
    id
    backend
    frontend
    port
    name
    server
    url
    muted
    status
    conditions
    loadBalancers {
      id
      name
    }
    automation
    dispatch
    chain {
      id
      name
      type
    }
    host {
      id
      name
    }
    basicAuth
  }
}
    `;
export type IUpdateNodeMutationFn = Apollo.MutationFunction<IUpdateNodeMutation, IUpdateNodeMutationVariables>;

/**
 * __useUpdateNodeMutation__
 *
 * To run a mutation, you first call `useUpdateNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNodeMutation, { data, loading, error }] = useUpdateNodeMutation({
 *   variables: {
 *      update: // value for 'update'
 *   },
 * });
 */
export function useUpdateNodeMutation(baseOptions?: Apollo.MutationHookOptions<IUpdateNodeMutation, IUpdateNodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IUpdateNodeMutation, IUpdateNodeMutationVariables>(UpdateNodeDocument, options);
      }
export type UpdateNodeMutationHookResult = ReturnType<typeof useUpdateNodeMutation>;
export type UpdateNodeMutationResult = Apollo.MutationResult<IUpdateNodeMutation>;
export type UpdateNodeMutationOptions = Apollo.BaseMutationOptions<IUpdateNodeMutation, IUpdateNodeMutationVariables>;
export const UpdateChainDocument = gql`
    mutation UpdateChain($update: ChainUpdate!) {
  updateChain(update: $update) {
    name
    type
    allowance
    chainId
    hasOwnEndpoint
    useOracles
    responsePath
    rpc
    endpoint
    healthyValue
  }
}
    `;
export type IUpdateChainMutationFn = Apollo.MutationFunction<IUpdateChainMutation, IUpdateChainMutationVariables>;

/**
 * __useUpdateChainMutation__
 *
 * To run a mutation, you first call `useUpdateChainMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateChainMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateChainMutation, { data, loading, error }] = useUpdateChainMutation({
 *   variables: {
 *      update: // value for 'update'
 *   },
 * });
 */
export function useUpdateChainMutation(baseOptions?: Apollo.MutationHookOptions<IUpdateChainMutation, IUpdateChainMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IUpdateChainMutation, IUpdateChainMutationVariables>(UpdateChainDocument, options);
      }
export type UpdateChainMutationHookResult = ReturnType<typeof useUpdateChainMutation>;
export type UpdateChainMutationResult = Apollo.MutationResult<IUpdateChainMutation>;
export type UpdateChainMutationOptions = Apollo.BaseMutationOptions<IUpdateChainMutation, IUpdateChainMutationVariables>;
export const UpdateOracleDocument = gql`
    mutation UpdateOracle($update: OracleUpdate!) {
  updateOracle(update: $update) {
    chain
    urls
  }
}
    `;
export type IUpdateOracleMutationFn = Apollo.MutationFunction<IUpdateOracleMutation, IUpdateOracleMutationVariables>;

/**
 * __useUpdateOracleMutation__
 *
 * To run a mutation, you first call `useUpdateOracleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOracleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOracleMutation, { data, loading, error }] = useUpdateOracleMutation({
 *   variables: {
 *      update: // value for 'update'
 *   },
 * });
 */
export function useUpdateOracleMutation(baseOptions?: Apollo.MutationHookOptions<IUpdateOracleMutation, IUpdateOracleMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IUpdateOracleMutation, IUpdateOracleMutationVariables>(UpdateOracleDocument, options);
      }
export type UpdateOracleMutationHookResult = ReturnType<typeof useUpdateOracleMutation>;
export type UpdateOracleMutationResult = Apollo.MutationResult<IUpdateOracleMutation>;
export type UpdateOracleMutationOptions = Apollo.BaseMutationOptions<IUpdateOracleMutation, IUpdateOracleMutationVariables>;
export const DeleteHostDocument = gql`
    mutation DeleteHost($id: ID!) {
  deleteHost(id: $id) {
    id
    name
  }
}
    `;
export type IDeleteHostMutationFn = Apollo.MutationFunction<IDeleteHostMutation, IDeleteHostMutationVariables>;

/**
 * __useDeleteHostMutation__
 *
 * To run a mutation, you first call `useDeleteHostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteHostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteHostMutation, { data, loading, error }] = useDeleteHostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteHostMutation(baseOptions?: Apollo.MutationHookOptions<IDeleteHostMutation, IDeleteHostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IDeleteHostMutation, IDeleteHostMutationVariables>(DeleteHostDocument, options);
      }
export type DeleteHostMutationHookResult = ReturnType<typeof useDeleteHostMutation>;
export type DeleteHostMutationResult = Apollo.MutationResult<IDeleteHostMutation>;
export type DeleteHostMutationOptions = Apollo.BaseMutationOptions<IDeleteHostMutation, IDeleteHostMutationVariables>;
export const DeleteLocationDocument = gql`
    mutation DeleteLocation($id: ID!) {
  deleteLocation(id: $id) {
    id
    name
  }
}
    `;
export type IDeleteLocationMutationFn = Apollo.MutationFunction<IDeleteLocationMutation, IDeleteLocationMutationVariables>;

/**
 * __useDeleteLocationMutation__
 *
 * To run a mutation, you first call `useDeleteLocationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLocationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLocationMutation, { data, loading, error }] = useDeleteLocationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteLocationMutation(baseOptions?: Apollo.MutationHookOptions<IDeleteLocationMutation, IDeleteLocationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IDeleteLocationMutation, IDeleteLocationMutationVariables>(DeleteLocationDocument, options);
      }
export type DeleteLocationMutationHookResult = ReturnType<typeof useDeleteLocationMutation>;
export type DeleteLocationMutationResult = Apollo.MutationResult<IDeleteLocationMutation>;
export type DeleteLocationMutationOptions = Apollo.BaseMutationOptions<IDeleteLocationMutation, IDeleteLocationMutationVariables>;
export const DeleteNodeDocument = gql`
    mutation DeleteNode($id: ID!) {
  deleteNode(id: $id) {
    id
    name
  }
}
    `;
export type IDeleteNodeMutationFn = Apollo.MutationFunction<IDeleteNodeMutation, IDeleteNodeMutationVariables>;

/**
 * __useDeleteNodeMutation__
 *
 * To run a mutation, you first call `useDeleteNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNodeMutation, { data, loading, error }] = useDeleteNodeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteNodeMutation(baseOptions?: Apollo.MutationHookOptions<IDeleteNodeMutation, IDeleteNodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IDeleteNodeMutation, IDeleteNodeMutationVariables>(DeleteNodeDocument, options);
      }
export type DeleteNodeMutationHookResult = ReturnType<typeof useDeleteNodeMutation>;
export type DeleteNodeMutationResult = Apollo.MutationResult<IDeleteNodeMutation>;
export type DeleteNodeMutationOptions = Apollo.BaseMutationOptions<IDeleteNodeMutation, IDeleteNodeMutationVariables>;
export const MuteMonitorDocument = gql`
    mutation MuteMonitor($id: ID!) {
  muteMonitor(id: $id) {
    id
    muted
    name
  }
}
    `;
export type IMuteMonitorMutationFn = Apollo.MutationFunction<IMuteMonitorMutation, IMuteMonitorMutationVariables>;

/**
 * __useMuteMonitorMutation__
 *
 * To run a mutation, you first call `useMuteMonitorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMuteMonitorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [muteMonitorMutation, { data, loading, error }] = useMuteMonitorMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useMuteMonitorMutation(baseOptions?: Apollo.MutationHookOptions<IMuteMonitorMutation, IMuteMonitorMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IMuteMonitorMutation, IMuteMonitorMutationVariables>(MuteMonitorDocument, options);
      }
export type MuteMonitorMutationHookResult = ReturnType<typeof useMuteMonitorMutation>;
export type MuteMonitorMutationResult = Apollo.MutationResult<IMuteMonitorMutation>;
export type MuteMonitorMutationOptions = Apollo.BaseMutationOptions<IMuteMonitorMutation, IMuteMonitorMutationVariables>;
export const UnmuteMonitorDocument = gql`
    mutation UnmuteMonitor($id: ID!) {
  unmuteMonitor(id: $id) {
    id
    muted
    name
  }
}
    `;
export type IUnmuteMonitorMutationFn = Apollo.MutationFunction<IUnmuteMonitorMutation, IUnmuteMonitorMutationVariables>;

/**
 * __useUnmuteMonitorMutation__
 *
 * To run a mutation, you first call `useUnmuteMonitorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnmuteMonitorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unmuteMonitorMutation, { data, loading, error }] = useUnmuteMonitorMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnmuteMonitorMutation(baseOptions?: Apollo.MutationHookOptions<IUnmuteMonitorMutation, IUnmuteMonitorMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IUnmuteMonitorMutation, IUnmuteMonitorMutationVariables>(UnmuteMonitorDocument, options);
      }
export type UnmuteMonitorMutationHookResult = ReturnType<typeof useUnmuteMonitorMutation>;
export type UnmuteMonitorMutationResult = Apollo.MutationResult<IUnmuteMonitorMutation>;
export type UnmuteMonitorMutationOptions = Apollo.BaseMutationOptions<IUnmuteMonitorMutation, IUnmuteMonitorMutationVariables>;
export const EnableHaProxyServerDocument = gql`
    mutation EnableHaProxyServer($id: ID!) {
  enableHaProxyServer(id: $id)
}
    `;
export type IEnableHaProxyServerMutationFn = Apollo.MutationFunction<IEnableHaProxyServerMutation, IEnableHaProxyServerMutationVariables>;

/**
 * __useEnableHaProxyServerMutation__
 *
 * To run a mutation, you first call `useEnableHaProxyServerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEnableHaProxyServerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [enableHaProxyServerMutation, { data, loading, error }] = useEnableHaProxyServerMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useEnableHaProxyServerMutation(baseOptions?: Apollo.MutationHookOptions<IEnableHaProxyServerMutation, IEnableHaProxyServerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IEnableHaProxyServerMutation, IEnableHaProxyServerMutationVariables>(EnableHaProxyServerDocument, options);
      }
export type EnableHaProxyServerMutationHookResult = ReturnType<typeof useEnableHaProxyServerMutation>;
export type EnableHaProxyServerMutationResult = Apollo.MutationResult<IEnableHaProxyServerMutation>;
export type EnableHaProxyServerMutationOptions = Apollo.BaseMutationOptions<IEnableHaProxyServerMutation, IEnableHaProxyServerMutationVariables>;
export const DisableHaProxyServerDocument = gql`
    mutation DisableHaProxyServer($id: ID!) {
  disableHaProxyServer(id: $id)
}
    `;
export type IDisableHaProxyServerMutationFn = Apollo.MutationFunction<IDisableHaProxyServerMutation, IDisableHaProxyServerMutationVariables>;

/**
 * __useDisableHaProxyServerMutation__
 *
 * To run a mutation, you first call `useDisableHaProxyServerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisableHaProxyServerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disableHaProxyServerMutation, { data, loading, error }] = useDisableHaProxyServerMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDisableHaProxyServerMutation(baseOptions?: Apollo.MutationHookOptions<IDisableHaProxyServerMutation, IDisableHaProxyServerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IDisableHaProxyServerMutation, IDisableHaProxyServerMutationVariables>(DisableHaProxyServerDocument, options);
      }
export type DisableHaProxyServerMutationHookResult = ReturnType<typeof useDisableHaProxyServerMutation>;
export type DisableHaProxyServerMutationResult = Apollo.MutationResult<IDisableHaProxyServerMutation>;
export type DisableHaProxyServerMutationOptions = Apollo.BaseMutationOptions<IDisableHaProxyServerMutation, IDisableHaProxyServerMutationVariables>;
export const ChainsDocument = gql`
    query Chains {
  chains {
    id
    name
    type
    chainId
    allowance
    hasOwnEndpoint
    useOracles
    responsePath
    rpc
    endpoint
    healthyValue
  }
}
    `;

/**
 * __useChainsQuery__
 *
 * To run a query within a React component, call `useChainsQuery` and pass it any options that fit your needs.
 * When your component renders, `useChainsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useChainsQuery({
 *   variables: {
 *   },
 * });
 */
export function useChainsQuery(baseOptions?: Apollo.QueryHookOptions<IChainsQuery, IChainsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IChainsQuery, IChainsQueryVariables>(ChainsDocument, options);
      }
export function useChainsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IChainsQuery, IChainsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IChainsQuery, IChainsQueryVariables>(ChainsDocument, options);
        }
export type ChainsQueryHookResult = ReturnType<typeof useChainsQuery>;
export type ChainsLazyQueryHookResult = ReturnType<typeof useChainsLazyQuery>;
export type ChainsQueryResult = Apollo.QueryResult<IChainsQuery, IChainsQueryVariables>;
export const HostsDocument = gql`
    query Hosts {
  hosts {
    id
    name
    ip
    fqdn
    loadBalancer
    location {
      id
      name
    }
  }
}
    `;

/**
 * __useHostsQuery__
 *
 * To run a query within a React component, call `useHostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHostsQuery({
 *   variables: {
 *   },
 * });
 */
export function useHostsQuery(baseOptions?: Apollo.QueryHookOptions<IHostsQuery, IHostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IHostsQuery, IHostsQueryVariables>(HostsDocument, options);
      }
export function useHostsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IHostsQuery, IHostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IHostsQuery, IHostsQueryVariables>(HostsDocument, options);
        }
export type HostsQueryHookResult = ReturnType<typeof useHostsQuery>;
export type HostsLazyQueryHookResult = ReturnType<typeof useHostsLazyQuery>;
export type HostsQueryResult = Apollo.QueryResult<IHostsQuery, IHostsQueryVariables>;
export const LocationsDocument = gql`
    query Locations {
  locations {
    id
    name
  }
}
    `;

/**
 * __useLocationsQuery__
 *
 * To run a query within a React component, call `useLocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationsQuery({
 *   variables: {
 *   },
 * });
 */
export function useLocationsQuery(baseOptions?: Apollo.QueryHookOptions<ILocationsQuery, ILocationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ILocationsQuery, ILocationsQueryVariables>(LocationsDocument, options);
      }
export function useLocationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ILocationsQuery, ILocationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ILocationsQuery, ILocationsQueryVariables>(LocationsDocument, options);
        }
export type LocationsQueryHookResult = ReturnType<typeof useLocationsQuery>;
export type LocationsLazyQueryHookResult = ReturnType<typeof useLocationsLazyQuery>;
export type LocationsQueryResult = Apollo.QueryResult<ILocationsQuery, ILocationsQueryVariables>;
export const NodeDocument = gql`
    query Node($id: ID!) {
  node(id: $id) {
    id
    backend
    frontend
    port
    name
    server
    url
    muted
    status
    conditions
    loadBalancers {
      id
      name
    }
    automation
    dispatch
    chain {
      id
      name
      type
      allowance
      chainId
      hasOwnEndpoint
      useOracles
      responsePath
      rpc
      endpoint
      healthyValue
    }
    host {
      id
      name
    }
    basicAuth
    erroredAt
  }
}
    `;

/**
 * __useNodeQuery__
 *
 * To run a query within a React component, call `useNodeQuery` and pass it any options that fit your needs.
 * When your component renders, `useNodeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNodeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useNodeQuery(baseOptions: Apollo.QueryHookOptions<INodeQuery, INodeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<INodeQuery, INodeQueryVariables>(NodeDocument, options);
      }
export function useNodeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<INodeQuery, INodeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<INodeQuery, INodeQueryVariables>(NodeDocument, options);
        }
export type NodeQueryHookResult = ReturnType<typeof useNodeQuery>;
export type NodeLazyQueryHookResult = ReturnType<typeof useNodeLazyQuery>;
export type NodeQueryResult = Apollo.QueryResult<INodeQuery, INodeQueryVariables>;
export const NodesDocument = gql`
    query Nodes {
  nodes {
    id
    backend
    frontend
    port
    name
    server
    url
    muted
    status
    conditions
    loadBalancers {
      id
      name
    }
    automation
    dispatch
    chain {
      id
      name
      type
      allowance
      chainId
      hasOwnEndpoint
      useOracles
      responsePath
      rpc
      endpoint
      healthyValue
    }
    host {
      id
      name
    }
    basicAuth
    erroredAt
  }
}
    `;

/**
 * __useNodesQuery__
 *
 * To run a query within a React component, call `useNodesQuery` and pass it any options that fit your needs.
 * When your component renders, `useNodesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNodesQuery({
 *   variables: {
 *   },
 * });
 */
export function useNodesQuery(baseOptions?: Apollo.QueryHookOptions<INodesQuery, INodesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<INodesQuery, INodesQueryVariables>(NodesDocument, options);
      }
export function useNodesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<INodesQuery, INodesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<INodesQuery, INodesQueryVariables>(NodesDocument, options);
        }
export type NodesQueryHookResult = ReturnType<typeof useNodesQuery>;
export type NodesLazyQueryHookResult = ReturnType<typeof useNodesLazyQuery>;
export type NodesQueryResult = Apollo.QueryResult<INodesQuery, INodesQueryVariables>;
export const LogsDocument = gql`
    query Logs($input: LogParams!) {
  logs(input: $input) {
    docs {
      message
      level
      timestamp
    }
    totalDocs
    page
    hasPrevPage
    hasNextPage
  }
}
    `;

/**
 * __useLogsQuery__
 *
 * To run a query within a React component, call `useLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLogsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLogsQuery(baseOptions: Apollo.QueryHookOptions<ILogsQuery, ILogsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ILogsQuery, ILogsQueryVariables>(LogsDocument, options);
      }
export function useLogsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ILogsQuery, ILogsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ILogsQuery, ILogsQueryVariables>(LogsDocument, options);
        }
export type LogsQueryHookResult = ReturnType<typeof useLogsQuery>;
export type LogsLazyQueryHookResult = ReturnType<typeof useLogsLazyQuery>;
export type LogsQueryResult = Apollo.QueryResult<ILogsQuery, ILogsQueryVariables>;
export const LogsForChartDocument = gql`
    query LogsForChart($input: LogChartParams!) {
  logsForChart(input: $input) {
    timestamp
    ok
    error
  }
}
    `;

/**
 * __useLogsForChartQuery__
 *
 * To run a query within a React component, call `useLogsForChartQuery` and pass it any options that fit your needs.
 * When your component renders, `useLogsForChartQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLogsForChartQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLogsForChartQuery(baseOptions: Apollo.QueryHookOptions<ILogsForChartQuery, ILogsForChartQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ILogsForChartQuery, ILogsForChartQueryVariables>(LogsForChartDocument, options);
      }
export function useLogsForChartLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ILogsForChartQuery, ILogsForChartQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ILogsForChartQuery, ILogsForChartQueryVariables>(LogsForChartDocument, options);
        }
export type LogsForChartQueryHookResult = ReturnType<typeof useLogsForChartQuery>;
export type LogsForChartLazyQueryHookResult = ReturnType<typeof useLogsForChartLazyQuery>;
export type LogsForChartQueryResult = Apollo.QueryResult<ILogsForChartQuery, ILogsForChartQueryVariables>;
export const OraclesDocument = gql`
    query Oracles {
  oracles {
    id
    chain
    urls
  }
}
    `;

/**
 * __useOraclesQuery__
 *
 * To run a query within a React component, call `useOraclesQuery` and pass it any options that fit your needs.
 * When your component renders, `useOraclesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOraclesQuery({
 *   variables: {
 *   },
 * });
 */
export function useOraclesQuery(baseOptions?: Apollo.QueryHookOptions<IOraclesQuery, IOraclesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IOraclesQuery, IOraclesQueryVariables>(OraclesDocument, options);
      }
export function useOraclesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IOraclesQuery, IOraclesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IOraclesQuery, IOraclesQueryVariables>(OraclesDocument, options);
        }
export type OraclesQueryHookResult = ReturnType<typeof useOraclesQuery>;
export type OraclesLazyQueryHookResult = ReturnType<typeof useOraclesLazyQuery>;
export type OraclesQueryResult = Apollo.QueryResult<IOraclesQuery, IOraclesQueryVariables>;
export const WebhooksDocument = gql`
    query Webhooks {
  webhooks {
    id
    location
    chain
    url
  }
}
    `;

/**
 * __useWebhooksQuery__
 *
 * To run a query within a React component, call `useWebhooksQuery` and pass it any options that fit your needs.
 * When your component renders, `useWebhooksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWebhooksQuery({
 *   variables: {
 *   },
 * });
 */
export function useWebhooksQuery(baseOptions?: Apollo.QueryHookOptions<IWebhooksQuery, IWebhooksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IWebhooksQuery, IWebhooksQueryVariables>(WebhooksDocument, options);
      }
export function useWebhooksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IWebhooksQuery, IWebhooksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IWebhooksQuery, IWebhooksQueryVariables>(WebhooksDocument, options);
        }
export type WebhooksQueryHookResult = ReturnType<typeof useWebhooksQuery>;
export type WebhooksLazyQueryHookResult = ReturnType<typeof useWebhooksLazyQuery>;
export type WebhooksQueryResult = Apollo.QueryResult<IWebhooksQuery, IWebhooksQueryVariables>;
export const GetHostsChainsAndLoadBalancersDocument = gql`
    query GetHostsChainsAndLoadBalancers {
  hosts {
    id
    name
    ip
    fqdn
    location {
      id
      name
    }
  }
  chains {
    id
    name
    type
    allowance
    chainId
    hasOwnEndpoint
    useOracles
    responsePath
    rpc
    endpoint
    healthyValue
  }
  loadBalancers: hosts(loadBalancer: true) {
    id
    name
    ip
    fqdn
    location {
      id
      name
    }
  }
}
    `;

/**
 * __useGetHostsChainsAndLoadBalancersQuery__
 *
 * To run a query within a React component, call `useGetHostsChainsAndLoadBalancersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHostsChainsAndLoadBalancersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHostsChainsAndLoadBalancersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetHostsChainsAndLoadBalancersQuery(baseOptions?: Apollo.QueryHookOptions<IGetHostsChainsAndLoadBalancersQuery, IGetHostsChainsAndLoadBalancersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IGetHostsChainsAndLoadBalancersQuery, IGetHostsChainsAndLoadBalancersQueryVariables>(GetHostsChainsAndLoadBalancersDocument, options);
      }
export function useGetHostsChainsAndLoadBalancersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IGetHostsChainsAndLoadBalancersQuery, IGetHostsChainsAndLoadBalancersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IGetHostsChainsAndLoadBalancersQuery, IGetHostsChainsAndLoadBalancersQueryVariables>(GetHostsChainsAndLoadBalancersDocument, options);
        }
export type GetHostsChainsAndLoadBalancersQueryHookResult = ReturnType<typeof useGetHostsChainsAndLoadBalancersQuery>;
export type GetHostsChainsAndLoadBalancersLazyQueryHookResult = ReturnType<typeof useGetHostsChainsAndLoadBalancersLazyQuery>;
export type GetHostsChainsAndLoadBalancersQueryResult = Apollo.QueryResult<IGetHostsChainsAndLoadBalancersQuery, IGetHostsChainsAndLoadBalancersQueryVariables>;
export const GetNodeStatusDocument = gql`
    query GetNodeStatus($id: ID!) {
  haProxyStatus: getHaProxyStatus(id: $id)
}
    `;

/**
 * __useGetNodeStatusQuery__
 *
 * To run a query within a React component, call `useGetNodeStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNodeStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNodeStatusQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNodeStatusQuery(baseOptions: Apollo.QueryHookOptions<IGetNodeStatusQuery, IGetNodeStatusQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IGetNodeStatusQuery, IGetNodeStatusQueryVariables>(GetNodeStatusDocument, options);
      }
export function useGetNodeStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IGetNodeStatusQuery, IGetNodeStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IGetNodeStatusQuery, IGetNodeStatusQueryVariables>(GetNodeStatusDocument, options);
        }
export type GetNodeStatusQueryHookResult = ReturnType<typeof useGetNodeStatusQuery>;
export type GetNodeStatusLazyQueryHookResult = ReturnType<typeof useGetNodeStatusLazyQuery>;
export type GetNodeStatusQueryResult = Apollo.QueryResult<IGetNodeStatusQuery, IGetNodeStatusQueryVariables>;
export const CheckValidHaProxyDocument = gql`
    query CheckValidHaProxy($input: NodeInput!) {
  validHaProxy: checkValidHaProxy(input: $input)
}
    `;

/**
 * __useCheckValidHaProxyQuery__
 *
 * To run a query within a React component, call `useCheckValidHaProxyQuery` and pass it any options that fit your needs.
 * When your component renders, `useCheckValidHaProxyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCheckValidHaProxyQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCheckValidHaProxyQuery(baseOptions: Apollo.QueryHookOptions<ICheckValidHaProxyQuery, ICheckValidHaProxyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ICheckValidHaProxyQuery, ICheckValidHaProxyQueryVariables>(CheckValidHaProxyDocument, options);
      }
export function useCheckValidHaProxyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ICheckValidHaProxyQuery, ICheckValidHaProxyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ICheckValidHaProxyQuery, ICheckValidHaProxyQueryVariables>(CheckValidHaProxyDocument, options);
        }
export type CheckValidHaProxyQueryHookResult = ReturnType<typeof useCheckValidHaProxyQuery>;
export type CheckValidHaProxyLazyQueryHookResult = ReturnType<typeof useCheckValidHaProxyLazyQuery>;
export type CheckValidHaProxyQueryResult = Apollo.QueryResult<ICheckValidHaProxyQuery, ICheckValidHaProxyQueryVariables>;
export const GetServerCountDocument = gql`
    query GetServerCount($id: ID!) {
  serverCount: getServerCount(id: $id) {
    online
    total
  }
}
    `;

/**
 * __useGetServerCountQuery__
 *
 * To run a query within a React component, call `useGetServerCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetServerCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetServerCountQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetServerCountQuery(baseOptions: Apollo.QueryHookOptions<IGetServerCountQuery, IGetServerCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IGetServerCountQuery, IGetServerCountQueryVariables>(GetServerCountDocument, options);
      }
export function useGetServerCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IGetServerCountQuery, IGetServerCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IGetServerCountQuery, IGetServerCountQueryVariables>(GetServerCountDocument, options);
        }
export type GetServerCountQueryHookResult = ReturnType<typeof useGetServerCountQuery>;
export type GetServerCountLazyQueryHookResult = ReturnType<typeof useGetServerCountLazyQuery>;
export type GetServerCountQueryResult = Apollo.QueryResult<IGetServerCountQuery, IGetServerCountQueryVariables>;
export const GetHealthCheckDocument = gql`
    query GetHealthCheck($id: ID!) {
  healthCheck: getHealthCheck(id: $id) {
    height {
      internalHeight
      delta
      externalHeight
    }
    details {
      noOracle
      badOracles
      nodeIsAheadOfPeer
      secondsToRecover
    }
    node {
      status
      conditions
      deltaArray
    }
    error
  }
}
    `;

/**
 * __useGetHealthCheckQuery__
 *
 * To run a query within a React component, call `useGetHealthCheckQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHealthCheckQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHealthCheckQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetHealthCheckQuery(baseOptions: Apollo.QueryHookOptions<IGetHealthCheckQuery, IGetHealthCheckQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IGetHealthCheckQuery, IGetHealthCheckQueryVariables>(GetHealthCheckDocument, options);
      }
export function useGetHealthCheckLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IGetHealthCheckQuery, IGetHealthCheckQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IGetHealthCheckQuery, IGetHealthCheckQueryVariables>(GetHealthCheckDocument, options);
        }
export type GetHealthCheckQueryHookResult = ReturnType<typeof useGetHealthCheckQuery>;
export type GetHealthCheckLazyQueryHookResult = ReturnType<typeof useGetHealthCheckLazyQuery>;
export type GetHealthCheckQueryResult = Apollo.QueryResult<IGetHealthCheckQuery, IGetHealthCheckQueryVariables>;