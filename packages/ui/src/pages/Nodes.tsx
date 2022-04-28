import { useEffect, useState } from "react";
import { Alert, AlertTitle, Grid, LinearProgress } from "@mui/material";

import { Table } from "components";
import { INode, useGetHostsChainsAndLoadBalancersQuery, useNodesQuery } from "types";

import NodesInventory from "components/Nodes/NodesInventory";
import NodeCRUD from "components/Nodes/NodeCRUD";
import NodesCSV from "components/Nodes/NodesCSV";

import env from "environment";

export enum NodeActionsState {
  Info = "info",
  Create = "create",
  Edit = "edit",
  Upload = "upload",
}

export function Nodes() {
  const [selectedNode, setSelectedNode] = useState<INode>(undefined);
  const [state, setState] = useState<NodeActionsState>(NodeActionsState.Info);
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
    // "port",
    // "status",
    "conditions",
    // "url",
    // "server",
    "haProxy",
    "muted",
  ];
  if (env("PNF")) {
    filterOptions.filters.push("Dispatch");
    filterOptions.filterFunctions.Dispatch = ({ dispatch }: INode) => Boolean(dispatch);
    columnsOrder.push("dispatch");
  }

  const nodeNames = data?.nodes.map(({ name }) => name);
  const hostPortCombos = data?.nodes.map(({ host, port }) => `${host.id}/${port}`);
  const hostPortCsvCombos = data?.nodes.map(({ host, port }) => `${host.name}/${port}`);
  const frontendNodeHosts = data?.nodes
    .filter(({ frontend }) => !!frontend)
    .map(({ host }) => host.id);

  const handleSelectRow = (row) => {
    setState(NodeActionsState.Info);
    setSelectedNode(row);
  };

  /* ----- Layout ----- */
  if (loading || formLoading) return <LinearProgress />;
  if (error || formError) {
    return (
      <Alert severity="error">
        <AlertTitle>{"Error fetching data: "}</AlertTitle>
        {(error || formError).message}
      </Alert>
    );
  }

  if (data && formData) {
    return (
      <>
        <NodesInventory nodes={data?.nodes as INode[]} setState={setState} />
        <Grid container spacing={{ sm: 0, lg: 3 }}>
          {(state === "info" || state === "create" || state === "edit") && (
            <Grid item sm={12} lg={5} order={{ lg: 2 }}>
              <NodeCRUD
                type={state}
                node={selectedNode}
                nodeNames={nodeNames}
                formData={formData}
                hostPortCombos={hostPortCombos}
                frontendNodeHosts={frontendNodeHosts}
                setState={setState}
                setSelectedNode={setSelectedNode}
                refetch={refetch}
              ></NodeCRUD>
            </Grid>
          )}
          {state === "upload" && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <NodesCSV
                nodeNames={nodeNames}
                formData={formData}
                hostPortCsvCombos={hostPortCsvCombos}
                refetchNodes={refetch}
                setState={setState}
              ></NodesCSV>
            </Grid>
          )}
          <Grid item sm={12} lg={7} order={{ lg: 1 }}>
            <Table<INode>
              type="Node"
              paginate
              searchable
              filterOptions={filterOptions}
              columnsOrder={columnsOrder}
              rows={data.nodes as INode[]}
              numPerPage={10}
              mapDisplay={(node) => ({
                ...node,
                chain: node.chain.name,
                host: node.host.name,
                loadBalancers: node.loadBalancers?.map(({ name }) => name),
              })}
              selectedRow={selectedNode?.id}
              onSelectRow={handleSelectRow}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  return <></>;
}
