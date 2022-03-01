import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_NODES } from "queries";
import { INode } from "types";
import { NodesForm } from "./NodesForm";
import { NodeStatus } from "./NodeStatus";

export function Nodes() {
  const [selectedNode, setSelectedNode] = useState<INode | undefined>(undefined);
  const { data, error, loading } = useQuery<{ nodes: INode[] }>(GET_ALL_NODES);

  if (loading && !selectedNode) return <>Loading...</>;
  if (error) return <>Error! ${error.message}</>;

  if (data) {
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
          {selectedNode && (
            <NodeStatus selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
          )}
        </div>
        <Table
          type="Nodes"
          paginate
          searchable
          rows={data.nodes}
          selectedRow={selectedNode?.id}
          onSelectRow={setSelectedNode}
        />
      </div>
    );
  }

  return <></>;
}
