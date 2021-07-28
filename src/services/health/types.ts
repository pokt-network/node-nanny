export enum NCResponse {
  SUCCESS = "succeeded!",
}

export enum EthVariants {
  ETH = "ETH",
  BSC = "BSC",
  // POL = "POL",
  // RIN = "RIN",
  // ROP = "ROP",
  // GOE = "GOE",
  // KOV = "KOV",
  // XDAI = "XDAI",
  // FUS = "FUS",
}

export enum NonEthVariants {
  AVA = "AVA",
}

export enum Errors {
  OFFLINE = -1,
}

export interface ExternalResponse {
  height: number;
}
