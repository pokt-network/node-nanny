import { IChain, INode } from '../../models';

export enum ENCResponse {
  SUCCESS = 'succeeded!',
}

export enum ESupportedBlockchains {
  ALG = 'ALG',
  ALGTST = 'ALGTST',
  AVA = 'AVA',
  AVATST = 'AVATST',
  BOBA = 'BOBA',
  BSC = 'BSC',
  BSCTST = 'BSCTST',
  ETH = 'ETH',
  EVMOS = 'EVMOS',
  FTM = 'FTM',
  FUS = 'FUS',
  GLMR = 'GLMR',
  GOE = 'GOE',
  HEI = 'HEI',
  HEITST = 'HEITST',
  HMY = 'HMY',
  IOT = 'IOT',
  MOVR = 'MOVR',
  NEAR = 'NEAR',
  OEC = 'OEC',
  OP = 'OP',
  POKT = 'POKT',
  POL = 'POL',
  'POL-ARCHIVAL' = 'POL-ARCHIVAL',
  'POL-MAINNET' = 'POL-MAINNET',
  POLTST = 'POLTST',
  RIN = 'RIN',
  SOL = 'SOL',
  XDAI = 'XDAI',
  /* PNF Internal only */
  'POKT-DIS' = 'POKT-DIS',
  'POKT-MAIN' = 'POKT-MAIN',
  'POKT-TEST' = 'POKT-TEST',
}

export enum ESupportedBlockchainTypes {
  EVM = 'EVM',
  AVA = 'AVA',
  TMT = 'TMT',
  POKT = 'POKT',
  SOL = 'SOL',
  ALG = 'ALG',
  HMY = 'HMY',
  NEAR = 'NEAR',
}

export enum EErrorConditions {
  /** The node is online, responding and synced */
  HEALTHY = 'HEALTHY',
  /** The node is not responding to a Netcat call */
  OFFLINE = 'OFFLINE',
  /** The node is not responding to an RPC request or is timing out */
  NO_RESPONSE = 'NO_RESPONSE',
  /** The node is behind by more than the chain allowance */
  NOT_SYNCHRONIZED = 'NOT_SYNCHRONIZED',
  /** The node is responding but returning an error response to the RPC request */
  ERROR_RESPONSE = 'ERROR_RESPONSE',
  /** The node has no healthy oracles and insufficient peers */
  NO_PEERS = 'NO_PEERS',
  /** The node is ahead of its peers */
  PEER_NOT_SYNCHRONIZED = 'PEER_NOT_SYNCHRONIZED',
  /** This status is applied to a new node, before the first health check has completed */
  PENDING = 'PENDING',
}

export enum EErrorStatus {
  ERROR = 'ERROR',
  OK = 'OK',
  INFO = 'INFO',
  WARNING = 'WARNING',
  PENDING = 'PENDING',
}

export interface IBlockHeight {
  delta: number;
  externalHeight: number;
  internalHeight: number;
}

export interface IHealthCheckParams {
  node: INode;
  oracles?: string[];
  peers?: string[];
}

export interface IHealthCheck {
  node: INode;
  height?: IBlockHeight;
  details?: IHealthResponseDetails;
  error?: string;
}

export interface IHealthResponse {
  name: string;
  status: EErrorStatus;
  conditions?: EErrorConditions;
  health?: any;
  error?: string;
  height?: IBlockHeight;
  details?: IHealthResponseDetails;
}

export interface IHealthResponseDetails {
  noOracle?: boolean;
  badOracles?: string[];
  nodeIsAheadOfPeer?: number;
  secondsToRecover?: number;
}

export interface IHealthResponseParams {
  name: string;
  result?: any;
  height?: IBlockHeight;
  secondsToRecover?: number;
  badOracles?: string[];
  noOracle?: boolean;
  error?: Error;
}

export interface INodeCheckParams {
  host: string;
  port: number;
}

export interface IOraclesResponse {
  oracleHeights: number[];
  badOracles: string[];
}

export interface IRefHeight {
  refHeight: number;
  badOracles?: string[];
  noOracle?: boolean;
}

export interface IRPCCheckParams {
  chain: IChain;
  url: string;
  basicAuth?: string;
}

export interface IRPCMethodParams {
  fullRpcUrl: string;
  basicAuth?: string;
  rpc?: { jsonrpc: string; id: number; method: string; params?: any[] };
}

export interface IRPCResult {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: { code: number; message: string };
}
