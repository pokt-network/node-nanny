import { INode } from '../../models';

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

export interface IPocketBlockHeight {
  height: number;
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

export interface IHealthCheck {
  node: INode;
  height?: IBlockHeight;
  details?: IHealthResponseDetails;
}

export interface IHealthResponseDetails {
  noOracle?: boolean;
  numPeers?: number;
  badOracles?: string[];
  nodeIsAheadOfPeer?: number;
  secondsToRecover?: number;
}

export interface IReferenceURL {
  url: string;
  auth?: string;
}

export interface IRPCResponse {
  jsonrpc: string;
  id: number;
  result?: string | number;
  error?: { code: number; message: string };
}

export interface IRPCSyncResponse {
  jsonrpc: string;
  id: number;
  result: boolean;
  error?: { code: number; message: string };
}

export interface IEVMHealthCheckOptions {
  harmony?: boolean;
}

export interface IOraclesResponse {
  oracleHeights: number[];
  badOracles: string[];
}

export interface IRefBlockHeight {
  refHeight: number;
  badOracles?: string[];
  noOracle?: boolean;
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
