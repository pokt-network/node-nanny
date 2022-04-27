import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
  useMuteMonitorMutation,
  useUnmuteMonitorMutation,
} from "types";
import { ModalHelper } from "utils";
import text from "utils/monitor-text";

import { ApolloQueryResult } from "@apollo/client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Alert, { AlertColor } from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

interface NodeCRUDProps {
  node: INode;
  type: NodeActionsState;
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
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
  setSelectedNode,
  setState,
  refetch,
}: NodeCRUDProps) => {
  const [title, setTitle] = useState("Select Node To View Status");
  const [severity, setSeverity] = useState<AlertColor>("success");

  const [getStatus, { data, error: getHaProxyStatusError, loading }] =
    useGetNodeStatusLazyQuery();
  const [enable, { error: enableHaProxyError }] = useEnableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });
  const [disable, { error: disableHaProxyError }] = useDisableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });

  useEffect(() => {
    getStatus({ variables: { id: node?.id } });
  }, [node, getStatus]);

  const haProxyOnline = { "0": true, "1": false, "-1": "n/a" }[
    String(data?.haProxyStatus)
  ];
  const haProxyButtonDisabled =
    !node?.haProxy ||
    loading ||
    !!getHaProxyStatusError ||
    typeof haProxyOnline !== "boolean";
  const haProxyButtonText = `${haProxyOnline ? "Remove" : "Add"} Node ${
    haProxyOnline ? "from" : "to"
  } Rotation`;

  const handleHaProxyButtonClick = (id: string) => {
    haProxyOnline ? disable({ variables: { id } }) : enable({ variables: { id } });
  };

  const handleMuteToggle = (id: string) =>
    node?.muted
      ? unmuteMonitor({ variables: { id } })
      : muteMonitor({ variables: { id } });

  const [muteMonitor, { error: muteMonitorError }] = useMuteMonitorMutation({
    onCompleted: ({ muteMonitor }) => {
      const { muted } = muteMonitor;
      setSelectedNode({ ...node!, muted });
    },
  });
  const [unmuteMonitor, { error: unmuteMonitorError }] = useUnmuteMonitorMutation({
    onCompleted: ({ unmuteMonitor }) => {
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...node!, muted });
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
        ).replaceAll("{node}", node.name),
        error: (enableHaProxyError || disableHaProxyError)?.message,
      },
    });
  };

  useEffect(() => {
    if (node) {
      if (type === "info") {
        setTitle("Selected Node");
      }
      if (type === "edit") {
        setTitle("Edit Node");
      }
      if (type === "create") {
        setTitle("Create Node");
      }
    } else {
      setTitle("Select Node To View Status");
    }
  }, [node, type]);

  useEffect(() => {
    if (node) {
      switch (node.status) {
        case "ERROR":
          return setSeverity("error");
        case "OK":
        default:
          return setSeverity("success");
      }
    }
  }, [node]);

  return (
    <Paper>
      <Grid container spacing={2}>
        <Grid item sm={12} md>
          <Title>{title}</Title>
        </Grid>
        {node && type !== "create" && (
          <Grid item sm={12} md="auto" sx={{ "& button": { marginLeft: 1 } }}>
            <Button
              variant="outlined"
              onClick={handleOpenMuteModal}
              disabled={!node}
              color="secondary"
              size="small"
            >
              {!node
                ? "Toggle Node Monitor"
                : node?.muted
                ? "Unmute Node Monitor"
                : "Mute Node Monitor"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenRotationModal}
              disabled={haProxyButtonDisabled}
              color="warning"
              size="small"
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Checking HAProxy Status
                </>
              ) : !node?.haProxy || haProxyOnline === "n/a" ? (
                "No HAProxy"
              ) : (
                haProxyButtonText
              )}
            </Button>
          </Grid>
        )}
      </Grid>
      <Box>
        {node && type !== "create" && (
          <Box
            sx={{
              width: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              p: 2,
              mb: 2,
              borderRadius: 1,
              backgroundColor: "background.default",
            }}
          >
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
        )}
        <NodeForm
          read={type === "info"}
          update={type === "info" || type === "edit"}
          nodeNames={nodeNames}
          formData={formData}
          hostPortCombos={hostPortCombos}
          refetchNodes={refetch}
          selectedNode={type !== "create" ? node : null}
          onCancel={() => setState(NodeActionsState.Info)}
          setState={setState}
        />
      </Box>
      {node && type !== "create" && getHaProxyStatusError && (
        <Box sx={{ marginTop: 2 }}>
          <Alert severity="error">
            <AlertTitle>{"Error fetching HAProxy status"}</AlertTitle>
            {getHaProxyStatusError.message}
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default NodeCRUD;
