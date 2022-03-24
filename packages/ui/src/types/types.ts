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

export type IChain = {
  allowance?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  type: Scalars['String'];
};

export type IHost = {
  fqdn?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  ip?: Maybe<Scalars['String']>;
  loadBalancer: Scalars['Boolean'];
  location: Scalars['String'];
  name: Scalars['String'];
};

export type IHostCsvInput = {
  fqdn?: InputMaybe<Scalars['String']>;
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
  location: Scalars['String'];
  name: Scalars['String'];
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

export type IMutation = {
  createHost?: Maybe<IHost>;
  createHostsCSV: Array<Maybe<IHost>>;
  createNode?: Maybe<INode>;
  createNodesCSV: Array<Maybe<INode>>;
  deleteChain?: Maybe<IChain>;
  deleteHost?: Maybe<IHost>;
  deleteNode?: Maybe<INode>;
  deleteOracle?: Maybe<IOracle>;
  disableHaProxyServer: Scalars['Boolean'];
  enableHaProxyServer: Scalars['Boolean'];
  muteMonitor: INode;
  unmuteMonitor: INode;
  updateChain?: Maybe<IChain>;
  updateHost?: Maybe<IHost>;
  updateNode?: Maybe<INode>;
  updateNodeInRotation?: Maybe<Scalars['String']>;
  updateOracle?: Maybe<IOracle>;
};


export type IMutationCreateHostArgs = {
  fqdn?: InputMaybe<Scalars['String']>;
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer: Scalars['Boolean'];
  location: Scalars['String'];
  name: Scalars['String'];
};


export type IMutationCreateHostsCsvArgs = {
  hosts: Array<IHostCsvInput>;
};


export type IMutationCreateNodeArgs = {
  input?: InputMaybe<INodeInput>;
};


export type IMutationCreateNodesCsvArgs = {
  nodes: Array<INodeCsvInput>;
};


export type IMutationDeleteChainArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationDeleteHostArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationDeleteNodeArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationDeleteOracleArgs = {
  id?: InputMaybe<Scalars['ID']>;
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
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
};


export type IMutationUpdateHostArgs = {
  ip?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};


export type IMutationUpdateNodeArgs = {
  input?: InputMaybe<INodeInput>;
};


export type IMutationUpdateNodeInRotationArgs = {
  action?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationUpdateOracleArgs = {
  action?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  url?: InputMaybe<Scalars['String']>;
};

export type INode = {
  backend?: Maybe<Scalars['String']>;
  chain: IChain;
  haProxy: Scalars['Boolean'];
  host: IHost;
  id: Scalars['ID'];
  loadBalancers?: Maybe<Array<Scalars['ID']>>;
  muted: Scalars['Boolean'];
  port: Scalars['Int'];
  server?: Maybe<Scalars['String']>;
  ssl?: Maybe<Scalars['Boolean']>;
  url: Scalars['String'];
};

export type INodeCsvInput = {
  backend?: InputMaybe<Scalars['String']>;
  chain: Scalars['String'];
  haProxy: Scalars['Boolean'];
  host: Scalars['String'];
  loadBalancers: Array<Scalars['String']>;
  port: Scalars['Int'];
  server?: InputMaybe<Scalars['String']>;
  url: Scalars['String'];
};

export type INodeInput = {
  backend?: InputMaybe<Scalars['String']>;
  chain: Scalars['ID'];
  haProxy: Scalars['Boolean'];
  host: Scalars['ID'];
  loadBalancers: Array<Scalars['ID']>;
  port: Scalars['Int'];
  server?: InputMaybe<Scalars['String']>;
  url: Scalars['String'];
};

export type IOracle = {
  chain: Scalars['String'];
  id: Scalars['ID'];
  urls?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  getHaProxyStatus: Scalars['Int'];
  hosts: Array<IHost>;
  locations: Array<ILocation>;
  logs: IPaginatedLogs;
  node: INode;
  nodeStatus: Scalars['String'];
  nodes: Array<INode>;
  oracles: Array<IOracle>;
  webhooks: Array<IWebhook>;
};


export type IQueryGetHaProxyStatusArgs = {
  id: Scalars['ID'];
};


export type IQueryHostsArgs = {
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
};


export type IQueryLogsArgs = {
  endDate?: InputMaybe<Scalars['String']>;
  limit: Scalars['Int'];
  nodeIds: Array<Scalars['ID']>;
  page: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};


export type IQueryNodeArgs = {
  id: Scalars['ID'];
};


export type IQueryNodeStatusArgs = {
  id?: InputMaybe<Scalars['String']>;
};

export type IWebhook = {
  chain: Scalars['String'];
  id: Scalars['ID'];
  location: Scalars['String'];
  url: Scalars['String'];
};

export type ICreateHostMutationVariables = Exact<{
  location: Scalars['String'];
  name: Scalars['String'];
  loadBalancer: Scalars['Boolean'];
  ip?: InputMaybe<Scalars['String']>;
  fqdn?: InputMaybe<Scalars['String']>;
}>;


export type ICreateHostMutation = { createHost?: { name: string, ip?: string | null, loadBalancer: boolean } | null };

export type ICreateNodeMutationVariables = Exact<{
  chain: Scalars['ID'];
  host: Scalars['ID'];
  port: Scalars['Int'];
  url: Scalars['String'];
  loadBalancers: Array<Scalars['ID']> | Scalars['ID'];
  haProxy: Scalars['Boolean'];
  backend?: InputMaybe<Scalars['String']>;
  server?: InputMaybe<Scalars['String']>;
}>;


export type ICreateNodeMutation = { createNode?: { id: string, url: string } | null };

export type ICreateNodesCsvMutationVariables = Exact<{
  nodes: Array<INodeCsvInput> | INodeCsvInput;
}>;


export type ICreateNodesCsvMutation = { createNodesCSV: Array<{ id: string } | null> };

export type ICreateHostsCsvMutationVariables = Exact<{
  hosts: Array<IHostCsvInput> | IHostCsvInput;
}>;


export type ICreateHostsCsvMutation = { createHostsCSV: Array<{ id: string } | null> };

export type IEnableHaProxyServerMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IEnableHaProxyServerMutation = { enableHaProxyServer: boolean };

export type IDisableHaProxyServerMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IDisableHaProxyServerMutation = { disableHaProxyServer: boolean };

export type IMuteMonitorMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IMuteMonitorMutation = { muteMonitor: { id: string, muted: boolean } };

export type IUnmuteMonitorMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IUnmuteMonitorMutation = { unmuteMonitor: { id: string, muted: boolean } };

export type IChainsQueryVariables = Exact<{ [key: string]: never; }>;


export type IChainsQuery = { chains: Array<{ id: string, name: string, type: string, allowance?: number | null }> };

export type IHostsQueryVariables = Exact<{ [key: string]: never; }>;


export type IHostsQuery = { hosts: Array<{ id: string, name: string, ip?: string | null, loadBalancer: boolean, location: string }> };

export type ILocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type ILocationsQuery = { locations: Array<{ id: string, name: string }> };

export type INodeQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type INodeQuery = { node: { id: string, backend?: string | null, port: number, server?: string | null, url: string, ssl?: boolean | null, muted: boolean, loadBalancers?: Array<string> | null } };

export type INodesQueryVariables = Exact<{ [key: string]: never; }>;


export type INodesQuery = { nodes: Array<{ id: string, backend?: string | null, port: number, server?: string | null, url: string, ssl?: boolean | null, muted: boolean, loadBalancers?: Array<string> | null }> };

export type ILogsQueryVariables = Exact<{
  nodeIds: Array<Scalars['ID']> | Scalars['ID'];
  page: Scalars['Int'];
  limit: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
}>;


export type ILogsQuery = { logs: { totalDocs: number, page: number, hasPrevPage: boolean, hasNextPage: boolean, docs: Array<{ message: string, level: string, timestamp: string }> } };

export type IOraclesQueryVariables = Exact<{ [key: string]: never; }>;


export type IOraclesQuery = { oracles: Array<{ id: string, chain: string, urls?: Array<string | null> | null }> };

export type IWebhooksQueryVariables = Exact<{ [key: string]: never; }>;


export type IWebhooksQuery = { webhooks: Array<{ id: string, location: string, chain: string, url: string }> };

export type IGetHostsChainsAndLoadBalancersQueryVariables = Exact<{ [key: string]: never; }>;


export type IGetHostsChainsAndLoadBalancersQuery = { hosts: Array<{ id: string, name: string, ip?: string | null, location: string }>, chains: Array<{ id: string, name: string }>, loadBalancers: Array<{ id: string, name: string }> };

export type IGetNodeStatusQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type IGetNodeStatusQuery = { haProxyStatus: number };


export const CreateHostDocument = gql`
    mutation CreateHost($location: String!, $name: String!, $loadBalancer: Boolean!, $ip: String, $fqdn: String) {
  createHost(
    location: $location
    name: $name
    ip: $ip
    fqdn: $fqdn
    loadBalancer: $loadBalancer
  ) {
    name
    ip
    loadBalancer
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
 *      location: // value for 'location'
 *      name: // value for 'name'
 *      loadBalancer: // value for 'loadBalancer'
 *      ip: // value for 'ip'
 *      fqdn: // value for 'fqdn'
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
export const CreateNodeDocument = gql`
    mutation CreateNode($chain: ID!, $host: ID!, $port: Int!, $url: String!, $loadBalancers: [ID!]!, $haProxy: Boolean!, $backend: String, $server: String) {
  createNode(
    input: {chain: $chain, host: $host, port: $port, url: $url, loadBalancers: $loadBalancers, haProxy: $haProxy, backend: $backend, server: $server}
  ) {
    id
    url
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
 *      chain: // value for 'chain'
 *      host: // value for 'host'
 *      port: // value for 'port'
 *      url: // value for 'url'
 *      loadBalancers: // value for 'loadBalancers'
 *      haProxy: // value for 'haProxy'
 *      backend: // value for 'backend'
 *      server: // value for 'server'
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
export const MuteMonitorDocument = gql`
    mutation MuteMonitor($id: ID!) {
  muteMonitor(id: $id) {
    id
    muted
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
export const ChainsDocument = gql`
    query Chains {
  chains {
    id
    name
    type
    allowance
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
    loadBalancer
    location
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
    port
    server
    url
    ssl
    muted
    loadBalancers
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
    port
    server
    url
    ssl
    muted
    loadBalancers
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
    query Logs($nodeIds: [ID!]!, $page: Int!, $limit: Int!, $startDate: String, $endDate: String) {
  logs(
    nodeIds: $nodeIds
    page: $page
    limit: $limit
    startDate: $startDate
    endDate: $endDate
  ) {
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
 *      nodeIds: // value for 'nodeIds'
 *      page: // value for 'page'
 *      limit: // value for 'limit'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
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
    location
  }
  chains {
    id
    name
  }
  loadBalancers: hosts(loadBalancer: true) {
    id
    name
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