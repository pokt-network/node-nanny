import { useState } from "react";

import { Table } from "components";
import { INode, useGetHostsChainsAndLoadBalancersQuery, useNodesQuery } from "types";

import { NodesCSV } from "./NodesCSV";
import { NodesForm } from "./NodesForm";
import { NodeStatus } from "./NodeStatus";

export function Nodes() {
  const [selectedNode, setSelectedNode] = useState<INode | undefined>(undefined);
  const { data, error, loading, refetch } = useNodesQuery();
  const {
    data: formData,
    error: formError,
    loading: formLoading,
  } = useGetHostsChainsAndLoadBalancersQuery();

  if ((loading || formLoading) && !selectedNode) return <>Loading...</>;
  if (error || formError) return <>Error! ${(error || formError)?.message}</>;

  if (data && formData) {
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
          <NodesForm formData={formData} refetchNodes={refetch} />
          {selectedNode && (
            <NodeStatus selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
          )}
          <NodesCSV formData={formData} />
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
