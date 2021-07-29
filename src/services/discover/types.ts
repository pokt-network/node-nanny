export interface Nodes {
  name: string;
  chain: string;
  ip: string;
  port: string;
}

export enum Source {
  CSV = "csv",
  TAG = "tag",
}

export enum Prefix {
  BLOCKCHAIN = "blockchain",
  NAME = "Name",
}

export enum Supported{
  AVA = "AVA",
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
