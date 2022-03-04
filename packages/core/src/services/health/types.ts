export enum NCResponse {
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

export enum SupportedBlockChainTypes {
  EVM = "EVM",
  AVA = "AVA",
  TMT = "TMT",
  POKT = "POKT",
  SOL = "SOL",
  ALG = "ALG",
  HMY = "HMY",
}

export enum ErrorConditions {
  HEALTHY = "HEALTHY",
  OFFLINE = "OFFLINE",
  NO_RESPONSE = "NO_RESPONSE",
  NOT_SYNCHRONIZED = "NOT_SYNCHRONIZED",
  NO_PEERS = "NO_PEERS",
  PEER_NOT_SYNCHRONIZED = "PEER_NOT_SYNCHRONIZED",
}

export enum ErrorStatus {
  ERROR = "ERROR",
  OK = "OK",
  INFO = "INFO",
  WARNING = "WARNING",
}

interface BlockHeight {
  delta: number;
  externalHeight: number;
  internalHeight: number;
}

export interface HealthResponse {
  name: string;
  status: ErrorStatus;
  conditions?: ErrorConditions;
  ethSyncing?: any;
  height?: BlockHeight;
  peers?: number;
  health?: any;
  details?: any;
  id?: string;
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
