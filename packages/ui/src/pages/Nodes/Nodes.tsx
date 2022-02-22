import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_NODES } from "queries";
import { INode } from "types";
import { NodesForm } from "./NodesForm";

export function Nodes() {
  const { data, error } = useQuery<{ nodes: INode[] }>(GET_ALL_NODES);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        margin: "16px",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <NodesForm />
      </div>
      {data && <Table paginate rows={data.nodes} />}
    </div>
  );
}
