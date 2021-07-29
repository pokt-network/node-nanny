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

export enum Errors {
  OFFLINE = -1,
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
  BSC = 15

}