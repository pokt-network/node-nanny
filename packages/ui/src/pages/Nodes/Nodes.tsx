import { useState } from "react";
import { Button } from "@mui/material";

import { Table } from "components";
import {
  INode,
  useDeleteNodeMutation,
  useGetHostsChainsAndLoadBalancersQuery,
  useNodesQuery,
} from "types";
import { ModalHelper } from "utils";

import { NodesCSV } from "./NodesCSV";
import { NodesForm } from "./NodesForm";
import { NodeStatus } from "./NodeStatus";
import { NodesUpdate } from "./NodesUpdate";

export function Nodes() {
  const [selectedNode, setSelectedNode] = useState<INode | undefined>(undefined);
  const { data, error, loading, refetch } = useNodesQuery();
  const {
    data: formData,
    error: formError,
    loading: formLoading,
  } = useGetHostsChainsAndLoadBalancersQuery();
  const [submit] = useDeleteNodeMutation({
    onCompleted: () => {
      refetch();
      ModalHelper.close();
    },
  });

  const handleOpenDeleteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => submit({ variables: { id: selectedNode!.id! } }),
        promptText: `Are you sure you wish to delete node ${selectedNode?.name}?`,
      },
    });
  };

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
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "column",
              marginBottom: "16px",
              marginRight: "32px",
              width: "600px",
            }}
          >
            <NodesForm formData={formData} refetchNodes={refetch} />
            <div
              style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}
            >
              <NodesCSV formData={formData} refetchNodes={refetch} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <NodesUpdate
                  selectedNode={selectedNode}
                  formData={formData}
                  refetchNodes={refetch}
                />
                <Button
                  onClick={handleOpenDeleteModal}
                  disabled={!selectedNode}
                  variant="outlined"
                >
                  Delete Node
                </Button>
              </div>
            </div>
          </div>
          <NodeStatus selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
        </div>
        <Table
          type="Nodes"
          paginate
          searchable
          rows={data.nodes}
          mapDisplay={(node) => ({
            ...node,
            chain: node.chain.name,
            host: node.host.name,
            loadBalancers: node.loadBalancers?.map(({ name }) => name),
          })}
          selectedRow={selectedNode?.id}
          onSelectRow={setSelectedNode}
        />
      </div>
    );
  }

  return <></>;
}
