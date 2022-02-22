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

export type IChain = {
  id?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type IHost = {
  id?: Maybe<Scalars['ID']>;
  ip?: Maybe<Scalars['String']>;
  loadBalancer?: Maybe<Scalars['Boolean']>;
  location?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type ILog = {
  id: Scalars['ID'];
  label?: Maybe<Scalars['ID']>;
  level?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['String']>;
};

export type IMutation = {
  createChain?: Maybe<IChain>;
  createHost?: Maybe<IHost>;
  createNode?: Maybe<INode>;
  createOracle?: Maybe<IOracle>;
  createWebhook?: Maybe<IWebhook>;
  deleteChain?: Maybe<IChain>;
  deleteNode?: Maybe<INode>;
  deleteOracle?: Maybe<IOracle>;
  deletehost?: Maybe<IHost>;
  updateChain?: Maybe<IChain>;
  updateHost?: Maybe<IHost>;
  updateNode?: Maybe<INode>;
  updateNodeInRotation?: Maybe<Scalars['String']>;
  updateOracle?: Maybe<IOracle>;
};


export type IMutationCreateChainArgs = {
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
};


export type IMutationCreateHostArgs = {
  ip?: InputMaybe<Scalars['String']>;
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
  location?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};


export type IMutationCreateNodeArgs = {
  input?: InputMaybe<INodeInput>;
};


export type IMutationCreateOracleArgs = {
  chain?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};


export type IMutationCreateWebhookArgs = {
  chain?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};


export type IMutationDeleteChainArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationDeleteNodeArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationDeleteOracleArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type IMutationDeletehostArgs = {
  id?: InputMaybe<Scalars['ID']>;
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
  basicAuth?: Maybe<Scalars['String']>;
  chain?: Maybe<IChain>;
  haProxy?: Maybe<Scalars['Boolean']>;
  host?: Maybe<IHost>;
  id: Scalars['ID'];
  loadBalancers?: Maybe<Array<Maybe<Scalars['ID']>>>;
  port?: Maybe<Scalars['Int']>;
  server?: Maybe<Scalars['String']>;
  ssl?: Maybe<Scalars['Boolean']>;
  url?: Maybe<Scalars['String']>;
  variance?: Maybe<Scalars['Int']>;
};

export type INodeInput = {
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

export type IOracle = {
  chain: Scalars['String'];
  id: Scalars['ID'];
  urls?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type IQuery = {
  chains?: Maybe<Array<Maybe<IChain>>>;
  haProxyStatus?: Maybe<Scalars['String']>;
  hosts?: Maybe<Array<Maybe<IHost>>>;
  logs?: Maybe<Array<Maybe<ILog>>>;
  nodeStatus?: Maybe<Scalars['String']>;
  nodes?: Maybe<Array<Maybe<INode>>>;
  oracles?: Maybe<Array<Maybe<IOracle>>>;
  webhooks?: Maybe<Array<Maybe<IWebhook>>>;
};


export type IQueryHaProxyStatusArgs = {
  id?: InputMaybe<Scalars['String']>;
};


export type IQueryHostsArgs = {
  loadBalancer?: InputMaybe<Scalars['Boolean']>;
};


export type IQueryLogsArgs = {
  id?: InputMaybe<Scalars['String']>;
};


export type IQueryNodeStatusArgs = {
  id?: InputMaybe<Scalars['String']>;
};

export type IWebhook = {
  chain?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  location?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};
