export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type IChain = {
  id: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  variance?: Maybe<Scalars["Int"]>;
};

export type IHost = {
  id: Scalars["ID"];
  ip?: Maybe<Scalars["String"]>;
  loadBalancer?: Maybe<Scalars["Boolean"]>;
  location?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
};

export type ILog = {
  id: Scalars["ID"];
  label?: Maybe<Scalars["ID"]>;
  level?: Maybe<Scalars["String"]>;
  message?: Maybe<Scalars["String"]>;
  timestamp?: Maybe<Scalars["String"]>;
};

export type IMutation = {
  createChain?: Maybe<IChain>;
  createHost?: Maybe<IHost>;
  createNode?: Maybe<INode>;
  createOracle?: Maybe<IOracle>;
  createWebhook?: Maybe<IWebhook>;
  deleteChain?: Maybe<IChain>;
  deleteHost?: Maybe<IHost>;
  deleteNode?: Maybe<INode>;
  deleteOracle?: Maybe<IOracle>;
  disableHaProxyServer?: Maybe<Scalars["Boolean"]>;
  enableHaProxyServer?: Maybe<Scalars["Boolean"]>;
  muteMonitor?: Maybe<Scalars["Boolean"]>;
  rebootServer?: Maybe<Scalars["String"]>;
  unmuteMonitor?: Maybe<Scalars["Boolean"]>;
  updateChain?: Maybe<IChain>;
  updateHost?: Maybe<IHost>;
  updateNode?: Maybe<INode>;
  updateNodeInRotation?: Maybe<Scalars["String"]>;
  updateOracle?: Maybe<IOracle>;
};

export type IMutationCreateChainArgs = {
  name?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<Scalars["String"]>;
  variance?: InputMaybe<Scalars["Int"]>;
};

export type IMutationCreateHostArgs = {
  ip?: InputMaybe<Scalars["String"]>;
  loadBalancer?: InputMaybe<Scalars["Boolean"]>;
  location?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
};

export type IMutationCreateNodeArgs = {
  input?: InputMaybe<INodeInput>;
};

export type IMutationCreateOracleArgs = {
  chain?: InputMaybe<Scalars["String"]>;
  url?: InputMaybe<Scalars["String"]>;
};

export type IMutationCreateWebhookArgs = {
  chain?: InputMaybe<Scalars["String"]>;
  location?: InputMaybe<Scalars["String"]>;
  url?: InputMaybe<Scalars["String"]>;
};

export type IMutationDeleteChainArgs = {
  id?: InputMaybe<Scalars["ID"]>;
};

export type IMutationDeleteHostArgs = {
  id?: InputMaybe<Scalars["ID"]>;
};

export type IMutationDeleteNodeArgs = {
  id?: InputMaybe<Scalars["ID"]>;
};

export type IMutationDeleteOracleArgs = {
  id?: InputMaybe<Scalars["ID"]>;
};

export type IMutationDisableHaProxyServerArgs = {
  id: Scalars["ID"];
};

export type IMutationEnableHaProxyServerArgs = {
  id: Scalars["ID"];
};

export type IMutationMuteMonitorArgs = {
  id: Scalars["ID"];
};

export type IMutationRebootServerArgs = {
  id: Scalars["ID"];
};

export type IMutationUnmuteMonitorArgs = {
  id: Scalars["ID"];
};

export type IMutationUpdateChainArgs = {
  name?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<Scalars["String"]>;
};

export type IMutationUpdateHostArgs = {
  ip?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
};

export type IMutationUpdateNodeArgs = {
  input?: InputMaybe<INodeInput>;
};

export type IMutationUpdateNodeInRotationArgs = {
  action?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
};

export type IMutationUpdateOracleArgs = {
  action?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  url?: InputMaybe<Scalars["String"]>;
};

export type INode = {
  backend?: Maybe<Scalars["String"]>;
  chain: IChain;
  haProxy: Scalars["Boolean"];
  host: IHost;
  id: Scalars["ID"];
  loadBalancers?: Maybe<Array<Maybe<Scalars["ID"]>>>;
  muted: Scalars["Boolean"];
  port: Scalars["Int"];
  server?: Maybe<Scalars["String"]>;
  ssl?: Maybe<Scalars["Boolean"]>;
  url: Scalars["String"];
};

export type INodeInput = {
  backend?: InputMaybe<Scalars["String"]>;
  chain?: InputMaybe<Scalars["ID"]>;
  haProxy?: InputMaybe<Scalars["Boolean"]>;
  host?: InputMaybe<Scalars["ID"]>;
  loadBalancers?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  port?: InputMaybe<Scalars["Int"]>;
  server?: InputMaybe<Scalars["String"]>;
  ssl?: InputMaybe<Scalars["Boolean"]>;
  url?: InputMaybe<Scalars["String"]>;
  variance?: InputMaybe<Scalars["Int"]>;
};

export type IOracle = {
  chain: Scalars["String"];
  id: Scalars["ID"];
  urls?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

export type IQuery = {
  chains?: Maybe<Array<Maybe<IChain>>>;
  getHaProxyStatus?: Maybe<Scalars["Int"]>;
  hosts?: Maybe<Array<Maybe<IHost>>>;
  logs?: Maybe<Array<Maybe<ILog>>>;
  nodeStatus?: Maybe<Scalars["String"]>;
  nodes?: Maybe<Array<Maybe<INode>>>;
  oracles?: Maybe<Array<Maybe<IOracle>>>;
  webhooks?: Maybe<Array<Maybe<IWebhook>>>;
};

export type IQueryGetHaProxyStatusArgs = {
  id: Scalars["ID"];
};

export type IQueryGetMuteStatusArgs = {
  id: Scalars["ID"];
};

export type IQueryHostsArgs = {
  loadBalancer?: InputMaybe<Scalars["Boolean"]>;
};

export type IQueryLogsArgs = {
  id?: InputMaybe<Scalars["String"]>;
};

export type IQueryNodeStatusArgs = {
  id?: InputMaybe<Scalars["String"]>;
};

export type IWebhook = {
  chain: Scalars["String"];
  id: Scalars["ID"];
  location?: Maybe<Scalars["String"]>;
  url: Scalars["String"];
};
