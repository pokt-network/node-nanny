export enum NCResponse {
  SUCCESS = "succeeded!",
}

export enum EthVariants {
  //ETH = "ETH",
  BSC = "BSC",
  // RIN = "RIN",
  // ROP = "ROP",
  // GOE = "GOE",
  // KOV = "KOV",
  // POL = "POL",
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

export enum BlockHeightVariance {
  ETH = 1,
  BSC = 15

}