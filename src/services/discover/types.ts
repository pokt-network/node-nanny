export interface Nodes {
  name: string;
  chain: string;
  ip: string;
  port: string;
}

export interface PocketNodes {
  url: string;
  port: string;
  host: string;
}

export enum Source {
  CSV = "csv",
  TAG = "tag",
}

export enum Prefix {
  BLOCKCHAIN = "blockchain",
  NAME = "Name",
}

export enum Supported {
  AVA = "AVA",
  ETH = "ETH",
  BSC = "BSC",
  BSCTST = "BSCTST",
  POL = "POL",
  FUS = "FUS",
  XDAI = "XDAI",
  RIN = "RIN",
  ROP = "ROP",
  GOE = "GOE",
  KOV = "KOV",
}
