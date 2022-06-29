import { IChain, INode } from '../../models';

export enum ENCResponse {
  SUCCESS = 'succeeded!',
}

export enum ESupportedBlockchains {
  AVA = 'AVA',
  AVATST = 'AVATST',
  ETH = 'ETH',
  BSC = 'BSC',
  BSCTST = 'BSCTST',
  POL = 'POL',
  POLTST = 'POLTST',
  FUS = 'FUS',
  XDAI = 'XDAI',
  RIN = 'RIN',
  ROP = 'ROP',
  GOE = 'GOE',
  KOV = 'KOV',
  HEI = 'HEI',
  POKT = 'POKT',
  NEAR = 'NEAR',
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
  HEALTHY = 'HEALTHY',
  OFFLINE = 'OFFLINE',
  NO_RESPONSE = 'NO_RESPONSE',
  NOT_SYNCHRONIZED = 'NOT_SYNCHRONIZED',
  NO_PEERS = 'NO_PEERS',
  PEER_NOT_SYNCHRONIZED = 'PEER_NOT_SYNCHRONIZED',
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
