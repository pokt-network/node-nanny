import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

import Paper from "components/Paper";
import Title from "components/Title";
import { NodeActionsState } from "pages/Nodes";
import NodeForm from "./NodeForm";
import {
  INode,
  INodesQuery,
  IGetHostsChainsAndLoadBalancersQuery,
  useDisableHaProxyServerMutation,
  useEnableHaProxyServerMutation,
  useGetNodeStatusLazyQuery,
  useGetServerCountLazyQuery,
  useMuteMonitorMutation,
  useUnmuteMonitorMutation,
} from "types";
import { ModalHelper, SnackbarHelper } from "utils";
import text from "utils/monitor-text";

import { ApolloQueryResult } from "@apollo/client";

interface NodeCRUDProps {
  node: INode;
  type: NodeActionsState;
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  frontendHostChainCombos: string[];
  setSelectedNode: Dispatch<SetStateAction<INode>>;
  refetch: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
  setState: Dispatch<NodeActionsState>;
}

export const NodeCRUD = ({
  node,
  nodeNames,
  type,
  formData,
  hostPortCombos,
  frontendHostChainCombos,
  setSelectedNode,
  setState,
  refetch,
}: NodeCRUDProps) => {
  const [title, setTitle] = useState("Select Node To View Status");

  const [getStatus, { data, error: getStatusError, loading }] =
    useGetNodeStatusLazyQuery();
  const [getServerCount, { data: serverCountData, loading: serverCountLoading }] =
    useGetServerCountLazyQuery();
  const [enable, { error: enableHaProxyError }] = useEnableHaProxyServerMutation({
    onCompleted: () => {
      SnackbarHelper.open({ text: "Node successfully added to rotation." });
      getStatus();
    },
  });
  const [disable, { error: disableHaProxyError }] = useDisableHaProxyServerMutation({
    onCompleted: () => {
      SnackbarHelper.open({ text: "Node successfully removed from rotation." });
      getStatus();
    },
  });

  useEffect(() => {
    if (node?.automation && !node?.frontend) {
      getStatus({ variables: { id: node.id } });
    }
    if (node?.automation || node?.frontend) {
      getServerCount({ variables: { id: node.id } });
    }
  }, [node, getStatus, getServerCount]);

  const haProxyOnline = { "0": true, "1": false, "-1": "n/a" }[
    String(data?.haProxyStatus)
  ];
  const haProxyButtonDisabled =
    !node?.automation ||
    loading ||
    !!getStatusError ||
    typeof haProxyOnline !== "boolean";
  const haProxyButtonText = `${haProxyOnline ? "Remove" : "Add"} Node ${
    haProxyOnline ? "from" : "to"
  } Rotation`;

  const { minsToSync, height, delta } = useMemo(() => {
    if (node?.conditions === "NOT_SYNCHRONIZED") {
      console.log({ node });
      const { deltaArray, secondsToRecover } = node;
      const minsToSync = Math.round(secondsToRecover / 60 || 0);
      const height = deltaArray?.[0];
      const delta = height - deltaArray?.[deltaArray.length - 1];

      return { minsToSync, height, delta };
    }
    return { minsToSync: 0, height: 0, delta: 0 };
  }, [node]);

  const handleHaProxyButtonClick = (id: string) => {
    haProxyOnline ? disable({ variables: { id } }) : enable({ variables: { id } });
  };

  const handleMuteToggle = (id: string) =>
    node?.muted
      ? unmuteMonitor({ variables: { id } })
      : muteMonitor({ variables: { id } });

  const [muteMonitor, { error: muteMonitorError }] = useMuteMonitorMutation({
    onCompleted: ({ muteMonitor }) => {
      SnackbarHelper.open({ text: `Node ${muteMonitor.name} successfully muted.` });
      const { muted } = muteMonitor;
      setSelectedNode({ ...node, muted });
      ModalHelper.close();
    },
  });
  const [unmuteMonitor, { error: unmuteMonitorError }] = useUnmuteMonitorMutation({
    onCompleted: ({ unmuteMonitor }) => {
      SnackbarHelper.open({ text: `Node ${muteMonitor.name} successfully unmuted.` });
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...node, muted });
      ModalHelper.close();
    },
  });

  const handleOpenMuteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleMuteToggle(node?.id),
        confirmText: `${node?.muted ? "Unmute" : "Mute"} Node: ${node?.name}`,
        okText: `${node?.muted ? "Unmute" : "Mute"} Node`,
        promptText: (node?.muted ? text.unmuteMonitor : text.muteMonitor).replaceAll(
          "{selectedNode}",
          node.name,
        ),
        error: (muteMonitorError || unmuteMonitorError)?.message,
      },
    });
  };

  const handleOpenRotationModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleHaProxyButtonClick(node?.id),
        confirmText: `${haProxyOnline ? "Disable" : "Enable"} Node: ${node?.name}`,
        okText: `${haProxyOnline ? "Disable" : "Enable"} Node`,
        promptText: (haProxyOnline
          ? text.removeFromRotation
          : text.addToRotation
        ).replaceAll("{selectedNode}", node.name),
        error: (enableHaProxyError || disableHaProxyError)?.message,
      },
    });
  };

  useEffect(() => {
    if (type === "create") {
      setTitle("Create Node");
    }
    if (type === "createFrontend") {
      setTitle("Create Frontend");
    }
    if (type === "edit") {
      setTitle("Edit Node");
    }
    if (type === "info") {
      setTitle("Select Node To View Status");
    }
    if (type === "info" && node) {
      setTitle(`Selected ${node.frontend ? "Frontend" : "Node"}`);
    }
  }, [node, type]);

  return (
    <Paper>
      <Grid container spacing={2}>
        <Grid item sm={12} md>
          <Title>{title}</Title>
        </Grid>
        {node && type !== "create" && type !== "createFrontend" && (
          <Grid item sm={12} md="auto" sx={{ "& button": { marginLeft: 1 } }}>
            <Button
              onClick={handleOpenMuteModal}
              disabled={!node}
              color="secondary"
              size="small"
              variant="outlined"
            >
              {node?.muted ? "Unmute Node" : "Mute Node"}
            </Button>
            <Button
              onClick={handleOpenRotationModal}
              disabled={haProxyButtonDisabled}
              color="warning"
              size="small"
              variant="outlined"
              sx={{ width: 222 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Checking HAProxy Status
                </>
              ) : !node?.automation || haProxyOnline === "n/a" ? (
                "No HAProxy"
              ) : (
                haProxyButtonText
              )}
            </Button>
          </Grid>
        )}
      </Grid>
      <Box>
        {node && type !== "create" && type !== "createFrontend" && (
          <Box
            sx={{
              width: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "space-between",
              justifyContent: "center",
              gap: 1,
              p: 2,
              mb: 2,
              borderRadius: 1,
              backgroundColor: "background.default",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Status &#38; Condition</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  sx={{
                    height: "10px",
                    width: "10px",
                  }}
                  color={
                    ({ OK: "success", ERROR: "error" }[node.status] as any) ||
                    ("default" as any)
                  }
                />
                <Typography>{node.conditions}</Typography>
              </Box>
            </Box>
            {(node.automation || node.frontend) && (
              <>
                {node.automation && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography>Load Balancer Status</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        sx={{
                          height: "10px",
                          width: "10px",
                        }}
                        color={loading ? "default" : haProxyOnline ? "success" : "error"}
                      />
                      <Typography>
                        {loading ? "..." : haProxyOnline ? "ONLINE" : "OFFLINE"}
                      </Typography>
                    </Box>
                  </Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>{`${
                    node.frontend ? "Frontend" : "Backend"
                  } Stats`}</Typography>
                  <Typography>
                    {serverCountLoading && !serverCountData
                      ? "..."
                      : !serverCountData?.serverCount
                      ? "Unable to fetch server count"
                      : `${serverCountData.serverCount.online} of ${serverCountData.serverCount.total} Online`}
                  </Typography>
                </Box>
              </>
            )}
            {node.conditions === "NOT_SYNCHRONIZED" && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>Time to Sync</Typography>
                <Typography>{minsToSync}</Typography>
              </Box>
            )}
          </Box>
        )}
        <NodeForm
          read={type === "info"}
          frontend={type === "createFrontend"}
          update={type === "info" || type === "edit"}
          nodeNames={nodeNames}
          formData={formData}
          hostPortCombos={hostPortCombos}
          frontendHostChainCombos={frontendHostChainCombos}
          refetchNodes={refetch}
          selectedNode={type !== "create" ? node : null}
          setSelectedNode={setSelectedNode}
          onCancel={() => setState(NodeActionsState.Info)}
          setState={setState}
        />
      </Box>
      {node && type !== "create" && getStatusError && (
        <Box sx={{ marginTop: 2 }}>
          <Alert severity="error">
            <AlertTitle>{"Error fetching HAProxy status"}</AlertTitle>
            {getStatusError.message}
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default NodeCRUD;
