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
