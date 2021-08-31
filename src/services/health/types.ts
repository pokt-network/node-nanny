export enum NCResponse {
  SUCCESS = "succeeded!",
}

export enum EthVariants {
  ETH = "ETH",
  BSC = "BSC",
  RIN = "RIN",
  ROP = "ROP",
  GOE = "GOE",
  KOV = "KOV",
  POL = "POL",
  XDAI = "XDAI",
  FUS = "FUS",
}

export enum NonEthVariants {
  AVA = "AVA",
}

export enum ErrorConditions {
  HEALTHY = "HEALTHY",
  OFFLINE = "OFFLINE",
  PEER_OFFLINE = "PEER_OFFLINE",
  NO_RESPONSE = "NO_RESPONSE",
  NO_RESPONSE_NOT_RESOLVED = "NO_RESPONSE_NOT_RESOLVED",
  NO_RESPONSE_ONE_NODE = "NO_RESPONSE_ONE_NODE",
  NOT_SYNCHRONIZED = "NOT_SYNCHRONIZED",
  NOT_SYNCHRONIZED_NOT_RESOLVED = "NOT_SYNCHRONIZED_NOT_RESOLVED",
}

export enum ErrorStatus {
  ERROR = "ERROR",
  OK = "OK",
  INFO = "INFO",
  WARNING = "WARNING",
}

export interface ExternalResponse {
  height: number;
}

export enum BlockHeightVariance {
  ETH = 5,
  RIN = 5,
  ROP = 5,
  GOE = 5,
  KOV = 5,
  POL = 5,
  XDAI = 5,
  FUS = 5,
  BSC = 15,
  POK = 3,
}

export enum BlockHeightThreshold {
  ETH = 2,
  RIN = 10,
  ROP = 10,
  GOE = 10,
  KOV = 10,
  POL = 10,
  XDAI = 5,
  FUS = 15,
  BSC = 10,
}

export enum Messages {
  OFFLINE = "This node is offfline!",
}

interface BlockHeight {
  delta: number;
  externalHeight: number;
  internalHeight: number;
}

export interface HealthResponse {
  name: string;
  conditions?: ErrorConditions;
  ethSyncing?: any;
  height?: BlockHeight;
  peers?: number;
  status: ErrorStatus;
  health?: any;
  details?: any;
}
