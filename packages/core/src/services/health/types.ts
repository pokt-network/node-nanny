export enum ENCResponse {
  SUCCESS = "succeeded!",
}

export enum ESupportedBlockChains {
  AVA = "AVA",
  AVATST = "AVATST",
  ETH = "ETH",
  BSC = "BSC",
  BSCTST = "BSCTST",
  POL = "POL",
  POLTST = "POLTST",
  FUS = "FUS",
  XDAI = "XDAI",
  RIN = "RIN",
  ROP = "ROP",
  GOE = "GOE",
  KOV = "KOV",
  HEI = "HEI",
  POKT = "POKT",
}

export enum ESupportedBlockChainTypes {
  EVM = "EVM",
  AVA = "AVA",
  TMT = "TMT",
  POKT = "POKT",
  SOL = "SOL",
  ALG = "ALG",
  HMY = "HMY",
}

export enum EErrorConditions {
  HEALTHY = "HEALTHY",
  OFFLINE = "OFFLINE",
  NO_RESPONSE = "NO_RESPONSE",
  NOT_SYNCHRONIZED = "NOT_SYNCHRONIZED",
  NO_PEERS = "NO_PEERS",
  PEER_NOT_SYNCHRONIZED = "PEER_NOT_SYNCHRONIZED",
}

export enum EErrorStatus {
  ERROR = "ERROR",
  OK = "OK",
  INFO = "INFO",
  WARNING = "WARNING",
}

interface IBlockHeight {
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
  height?: IBlockHeight | number;
  peers?: number;
  health?: any;
  details?: any;
  id?: string;
}

export interface IEVMHealthResponse extends IHealthResponse {
  ethSyncing?: boolean;
}

export interface IPocketHealthResponse extends IHealthResponse {
  delta?: number;
  referenceNodes?: string[];
  highest?: any;
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
