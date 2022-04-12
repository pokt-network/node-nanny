import { useState } from "react";
import { Alert, AlertTitle, Button, LinearProgress } from "@mui/material";

import { Table } from "components";
import { INode, useGetHostsChainsAndLoadBalancersQuery, useNodesQuery } from "types";
import { ModalHelper } from "utils";

import { NodeStatus } from "./NodeStatus";

export function Nodes() {
  const [selectedNode, setSelectedNode] = useState<INode | undefined>(undefined);
  const { data, error, loading, refetch } = useNodesQuery();
  const {
    data: formData,
    error: formError,
    loading: formLoading,
  } = useGetHostsChainsAndLoadBalancersQuery();

  const nodeNames = data?.nodes.map(({ name }) => name);
  const hostPortCombos = data?.nodes.map(({ host, port }) => `${host.id}/${port}`);

  const handleOpenCreateNodeModal = () => {
    ModalHelper.open({
      modalType: "nodesForm",
      modalProps: { formData, refetchNodes: refetch, nodeNames, hostPortCombos },
    });
  };

  const handleOpenUploadNodeCSVModal = () => {
    ModalHelper.open({
      modalType: "nodesCsv",
      modalProps: { formData, refetchNodes: refetch },
    });
  };

  if (loading || formLoading) return <LinearProgress />;
  if (error || formError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{"Error fetching data: "}</AlertTitle>
          {(error || formError).message}
        </Alert>
      </>
    );

  if (data && formData) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Button
              style={{ marginBottom: 8, marginRight: 8, width: 150 }}
              onClick={handleOpenCreateNodeModal}
              variant="contained"
              color="success"
            >
              Create Node
            </Button>
            <Button
              style={{ marginBottom: 8, marginRight: 8, width: 150 }}
              onClick={handleOpenUploadNodeCSVModal}
              variant="contained"
              color="success"
            >
              Upload CSV
            </Button>
          </div>
          <NodeStatus
            selectedNode={selectedNode}
            formData={formData}
            nodeNames={nodeNames}
            hostPortCombos={hostPortCombos}
            setSelectedNode={setSelectedNode}
            refetchNodes={refetch}
          />
        </div>
        <Table
          type="Node"
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
