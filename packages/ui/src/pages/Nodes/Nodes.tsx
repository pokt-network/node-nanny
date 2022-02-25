import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_NODES } from "queries";
import { INode } from "types";
import { NodesForm } from "./NodesForm";
import { NodeStatus } from "./NodeStatus";

export function Nodes() {
  const { data, error } = useQuery<{ nodes: INode[] }>(GET_ALL_NODES);

  if (error) console.log("ERROR LOADING NODES", error);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "60%",
          marginBottom: "16px",
        }}
      >
        <NodesForm />
        <NodeStatus />
      </div>
      {data && <Table paginate rows={data.nodes} />}
    </div>
  );
}
