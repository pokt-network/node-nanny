import { useEffect, useState } from "react";
import { Alert, AlertTitle, Grid, LinearProgress } from "@mui/material";

import { Table } from "components";
import { INode, useGetHostsChainsAndLoadBalancersQuery, useNodesQuery } from "types";
import { ModalHelper } from "utils";

import NodesInventory from "components/Nodes/NodesInventory";
import NodeCRUD from "components/Nodes/NodeCRUD";

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
    "status",
    // "conditions",
    // "url",
    // "server",
    "haProxy",
    "muted",
  ];
  if (process.env.REACT_APP_PNF === "1") {
    filterOptions.filters.push("Dispatch");
    filterOptions.filterFunctions.Dispatch = ({ dispatch }: INode) => Boolean(dispatch);
    // columnsOrder.push("dispatch");
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
  if (loading) return <LinearProgress />;
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

  if (data) {
    return (
      <>
        <NodesInventory nodes={data?.nodes as INode[]} setState={setState} />
        <Grid container spacing={{ sm: 0, lg: 4 }}>
          {(state === "info" || state === "create" || state === "edit") && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <NodeCRUD
                type={state}
                node={selectedNode}
                nodeNames={nodeNames}
                formData={formData}
                hostPortCombos={hostPortCombos}
                setState={setState}
                setSelectedNode={setSelectedNode}
                refetch={refetch}
              ></NodeCRUD>
            </Grid>
          )}
          <Grid item sm={12} lg={6} order={{ lg: 1 }}>
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
              onSelectRow={setSelectedNode}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  return <></>;
}
