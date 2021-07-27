export interface Nodes {
  name: string;
  type: string;
  ip: string;
  port: string;
  https: string;
}

export enum Source {
  CSV = "csv",
  TAG = "tag",
}

export enum Prefix {
  BLOCKCHAIN = "blockchain",
  NAME = "Name",
}
