export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Chain = {
  __typename?: 'Chain';
  id?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type Host = {
  __typename?: 'Host';
  id?: Maybe<Scalars['ID']>;
  ip?: Maybe<Scalars['String']>;
  loadBalancer?: Maybe<Scalars['Boolean']>;
  location?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type Log = {
  __typename?: 'Log';
  id: Scalars['ID'];
  label?: Maybe<Scalars['ID']>;
  level?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createChain?: Maybe<Chain>;
  createHost?: Maybe<Host>;
  createNode?: Maybe<Node>;
  createOracle?: Maybe<Oracle>;
  createWebhook?: Maybe<Webhook>;
  deleteChain?: Maybe<Chain>;
  deleteNode?: Maybe<Node>;
  deleteOracle?: Maybe<Oracle>;
  deletehost?: Maybe<Host>;
  updateChain?: Maybe<Chain>;
  updateHost?: Maybe<Host>;
  updateNode?: Maybe<Node>;
  updateNodeInRotation?: Maybe<Scalars['String']>;
  updateOracle?: Maybe<Oracle>;
};


export type MutationCreateChainArgs = {
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
};


export type MutationCreateHostArgs = {
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
  location?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};


export type MutationCreateNodeArgs = {
  input?: InputMaybe<NodeInput>;
};


export type MutationCreateOracleArgs = {
  chain?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};


export type MutationCreateWebhookArgs = {
  chain?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};


export type MutationDeleteChainArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationDeleteNodeArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationDeleteOracleArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationDeletehostArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationUpdateChainArgs = {
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateHostArgs = {
  ip?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateNodeArgs = {
  input?: InputMaybe<NodeInput>;
};


export type MutationUpdateNodeInRotationArgs = {
  action?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationUpdateOracleArgs = {
  action?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  url?: InputMaybe<Scalars['String']>;
};

export type Node = {
  __typename?: 'Node';
  backend?: Maybe<Scalars['String']>;
  basicAuth?: Maybe<Scalars['String']>;
  chain?: Maybe<Chain>;
  haProxy?: Maybe<Scalars['Boolean']>;
  host?: Maybe<Host>;
  id: Scalars['ID'];
  loadBalancers?: Maybe<Array<Maybe<Scalars['ID']>>>;
  port?: Maybe<Scalars['Int']>;
  server?: Maybe<Scalars['String']>;
  ssl?: Maybe<Scalars['Boolean']>;
  url?: Maybe<Scalars['String']>;
  variance?: Maybe<Scalars['Int']>;
};

export type NodeInput = {
  backend?: InputMaybe<Scalars['String']>;
  basicAuth?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Scalars['ID']>;
  haProxy?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<Scalars['ID']>;
  loadBalancers?: InputMaybe<Array<InputMaybe<Scalars['ID']>>>;
  port?: InputMaybe<Scalars['Int']>;
  server?: InputMaybe<Scalars['String']>;
  ssl?: InputMaybe<Scalars['Boolean']>;
  url?: InputMaybe<Scalars['String']>;
  variance?: InputMaybe<Scalars['Int']>;
};

export type Oracle = {
  __typename?: 'Oracle';
  chain: Scalars['String'];
  id: Scalars['ID'];
  urls?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type Query = {
  __typename?: 'Query';
  chains?: Maybe<Array<Maybe<Chain>>>;
  haProxyStatus?: Maybe<Scalars['String']>;
  hosts?: Maybe<Array<Maybe<Host>>>;
  logs?: Maybe<Array<Maybe<Log>>>;
  nodeStatus?: Maybe<Scalars['String']>;
  nodes?: Maybe<Array<Maybe<Node>>>;
  oracles?: Maybe<Array<Maybe<Oracle>>>;
  webhooks?: Maybe<Array<Maybe<Webhook>>>;
};


export type QueryHaProxyStatusArgs = {
  id?: InputMaybe<Scalars['String']>;
};


export type QueryHostsArgs = {
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
};


export type QueryLogsArgs = {
  id?: InputMaybe<Scalars['String']>;
};


export type QueryNodeStatusArgs = {
  id?: InputMaybe<Scalars['String']>;
};

export type Webhook = {
  __typename?: 'Webhook';
  chain?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  location?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};
