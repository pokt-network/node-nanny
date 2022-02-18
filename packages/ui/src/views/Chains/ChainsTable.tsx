import * as React from "react";
import { Table } from "../../components";

// TEMP - Add to common package

interface IChain {
  id: string;
  chain: string;
  name: string;
  type: string;
}

interface ChainsTableProps {
  chains: IChain[];
}

export function ChainsTable({ chains }: ChainsTableProps) {
  return <Table rows={chains} />;
}
