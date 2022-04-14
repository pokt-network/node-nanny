import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";

import { Table } from "components";
import { INode, useGetHostsChainsAndLoadBalancersQuery, useNodesQuery } from "types";
import { ModalHelper } from "utils";

import { NodeStatus } from "./NodeStatus";

export function Nodes() {
  const [selectedNode, setSelectedNode] = useState<INode>(undefined);
  const { data, error, loading, refetch } = useNodesQuery();
  const {
    data: formData,
    error: formError,
    loading: formLoading,
  } = useGetHostsChainsAndLoadBalancersQuery();

  useEffect(() => {
    refetch();
  }, [refetch]);

  /* ----- Table Options ---- */
  const filterOptions = {
    filters: ["All", "Healthy", "Error", "Muted", "HAProxy", "Frontend"],
    filterFunctions: {
      Healthy: ({ status }: INode) => status === "OK",
      Error: ({ status }: INode) => status === "ERROR",
      Muted: ({ muted }: INode) => Boolean(muted),
      HAProxy: ({ haProxy }: INode) => Boolean(haProxy),
      Frontend: ({ frontend }: INode) => Boolean(frontend),
    } as any,
  };
  const columnsOrder = [
    "name",
    "chain",
    "host",
    "port",
    "status",
    "conditions",
    "url",
    "server",
    "haProxy",
    "muted",
  ];
  if (process.env.REACT_APP_PNF === "1") {
    filterOptions.filters.push("Dispatch");
    filterOptions.filterFunctions.Dispatch = ({ dispatch }: INode) => Boolean(dispatch);
    columnsOrder.push("dispatch");
  }

  /* ----- Modal Methods ----- */
  const nodeNames = data?.nodes.map(({ name }) => name);
  const hostPortCombos = data?.nodes.map(({ host, port }) => `${host.id}/${port}`);
  const hostPortCsvCombos = data?.nodes.map(({ host, port }) => `${host.name}/${port}`);

  const handleOpenCreateNodeModal = () => {
    ModalHelper.open({
      modalType: "nodesForm",
      modalProps: { formData, refetchNodes: refetch, nodeNames, hostPortCombos },
    });
  };

  const handleOpenUploadNodeCSVModal = () => {
    ModalHelper.open({
      modalType: "nodesCsv",
      modalProps: { formData, refetchNodes: refetch, nodeNames, hostPortCsvCombos },
    });
  };

  /* ----- Layout ----- */
  if (loading || formLoading) return <LinearProgress />;
  if (error || formError) {
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{"Error fetching data: "}</AlertTitle>
          {(error || formError).message}
        </Alert>
      </>
    );
  }

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
          <Paper
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 500,
              height: 250,
              padding: 10,
              marginRight: 16,
              marginBottom: 16,
            }}
            variant="outlined"
          >
            <Typography variant="h4" align="center">
              Nodes Inventory
            </Typography>
            <div style={{ marginLeft: 8 }}>
              <Typography>{data?.nodes.length} Nodes</Typography>
              <Typography>
                {data?.nodes.filter(({ status }) => status === "OK").length} Healthy
              </Typography>
              <Typography>
                {data?.nodes.filter(({ status }) => status === "ERROR").length} Errored
              </Typography>
              <Typography>
                {data?.nodes.filter(({ muted }) => muted).length} Muted
              </Typography>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                width: "100%",
              }}
            >
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
          </Paper>
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
          filterOptions={filterOptions}
          columnsOrder={columnsOrder}
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
