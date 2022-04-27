import { Dispatch, SetStateAction, useEffect } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import {
  INode,
  INodesQuery,
  useDeleteNodeMutation,
  useDisableHaProxyServerMutation,
  useEnableHaProxyServerMutation,
  IGetHostsChainsAndLoadBalancersQuery,
  useGetNodeStatusLazyQuery,
  useMuteMonitorMutation,
  useUnmuteMonitorMutation,
} from "types";
import { ModalHelper } from "utils";
import text from "./text";

interface INodeStatusProps {
  selectedNode: INode;
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  setSelectedNode: Dispatch<SetStateAction<INode>>;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodeStatus({
  selectedNode,
  formData,
  nodeNames,
  hostPortCombos,
  setSelectedNode,
  refetchNodes,
}: INodeStatusProps) {
  /* ----- Display Node ----- */
  const {
    id,
    name,
    backend,
    frontend,
    port,
    server,
    url,
    muted,
    haProxy,
    loadBalancers,
  } = selectedNode || {
    id: "",
    name: "",
    backend: "",
    frontend: "",
    port: "",
    server: "",
    url: "",
    muted: undefined,
    haProxy: undefined,
    loadBalancers: [],
  };

  /* ----- Delete Node ----- */
  const [submit, { error: deleteNodeError }] = useDeleteNodeMutation({
    onCompleted: () => {
      refetchNodes();
      ModalHelper.close();
    },
  });

  /* ----- Mute/Unmute Node ----- */
  const [muteMonitor, { error: muteMonitorError }] = useMuteMonitorMutation({
    onCompleted: ({ muteMonitor }) => {
      const { muted } = muteMonitor;
      setSelectedNode({ ...selectedNode!, muted });
      ModalHelper.close();
    },
  });
  const [unmuteMonitor, { error: unmuteMonitorError }] = useUnmuteMonitorMutation({
    onCompleted: ({ unmuteMonitor }) => {
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...selectedNode!, muted });
      ModalHelper.close();
    },
  });

  const muteStatusText = !selectedNode
    ? "No Node Selected"
    : muted
    ? "Muted"
    : "Not Muted";

  const handleMuteToggle = (id: string) =>
    muted ? unmuteMonitor({ variables: { id } }) : muteMonitor({ variables: { id } });

  /* ----- HAProxy Status ----- */
  const [getStatus, { data, error: getHaProxyStatusError, loading }] =
    useGetNodeStatusLazyQuery();
  const [enable, { error: enableHaProxyError }] = useEnableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });
  const [disable, { error: disableHaProxyError }] = useDisableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });

  useEffect(() => {
    if (haProxy) getStatus({ variables: { id: selectedNode?.id } });
  }, [haProxy, selectedNode, getStatus]);

  const haProxyOnline = { "0": true, "1": false, "-1": "n/a" }[
    String(data?.haProxyStatus)
  ];
  const haProxyButtonDisabled =
    !haProxy || loading || !!getHaProxyStatusError || typeof haProxyOnline !== "boolean";
  const haProxyStatusText = haProxyOnline ? "Online" : "Offline";
  const haProxyButtonText = `${haProxyOnline ? "Remove" : "Add"} Node ${
    haProxyOnline ? "from" : "to"
  } Rotation`;

  const handleHaProxyButtonClick = (id: string) => {
    haProxyOnline ? disable({ variables: { id } }) : enable({ variables: { id } });
  };

  /* ----- Modal Methods ----- */
  const handleOpenUpdateNodeModal = () => {
    ModalHelper.open({
      modalType: "nodesForm",
      modalProps: {
        update: true,
        selectedNode,
        formData,
        nodeNames,
        hostPortCombos,
        refetchNodes,
      },
    });
  };

  const handleOpenDeleteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => submit({ variables: { id: selectedNode!.id! } }),
        okText: "Delete Node",
        okColor: "error",
        cancelColor: "primary",
        promptText: `Are you sure you wish to remove node ${selectedNode?.name} from the inventory database?`,
        error: deleteNodeError?.message,
      },
    });
  };

  const handleOpenMuteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleMuteToggle(id),
        confirmText: `Confirm ${muted ? "Unmute" : "Mute"} Node`,
        okText: `${muted ? "Unmute" : "Mute"} Node`,
        promptText: (muted ? text.unmuteMonitor : text.muteMonitor).replaceAll(
          "{selectedNode}",
          selectedNode.name,
        ),
        error: (muteMonitorError || unmuteMonitorError)?.message,
      },
    });
  };

  const handleOpenRotationModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleHaProxyButtonClick(id),
        confirmText: `Confirm ${haProxyOnline ? "Disable" : "Enable"} Node`,
        okText: `${haProxyOnline ? "Disable" : "Enable"} Node`,
        promptText: (haProxyOnline
          ? text.removeFromRotation
          : text.addToRotation
        ).replaceAll("{selectedNode}", selectedNode.name),
        error: (enableHaProxyError || disableHaProxyError)?.message,
      },
    });
  };

  return (
    <>
      <Paper style={{ padding: 10, height: "auto" }} variant="outlined">
        <Typography align="center" variant="h6" gutterBottom>
          {!selectedNode ? "Select Node to view Status" : "Selected Node"}
        </Typography>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Paper
            style={{ padding: 10, marginRight: 8, width: 500, height: "100%" }}
            variant="outlined"
          >
            <Typography>Name: {name}</Typography>
            <Typography>{`${frontend ? "Frontend" : "Backend"}: ${
              (backend || frontend) ?? "None"
            }`}</Typography>
            <Typography>Port: {port}</Typography>
            <Typography>Server: {server ?? "None"}</Typography>
            <Typography>URL: {url}</Typography>
            <Typography gutterBottom>
              Load Balancers:{" "}
              {loadBalancers?.length
                ? loadBalancers.map(({ name }) => name).join(",")
                : "None"}
            </Typography>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                onClick={handleOpenUpdateNodeModal}
                disabled={!selectedNode}
                variant="contained"
                style={{ marginRight: 8 }}
              >
                Update Node
              </Button>
              <Button
                onClick={handleOpenDeleteModal}
                disabled={!selectedNode}
                variant="contained"
                color="error"
              >
                Delete Node
              </Button>
            </div>
          </Paper>
          <Paper
            style={{ display: "flex", flexDirection: "column", padding: 10, width: 305 }}
            variant="outlined"
          >
            <Typography>
              HAProxy Status: {haProxy ? haProxyStatusText : "No HAProxy"}
            </Typography>
            <Typography gutterBottom>Mute Status: {muteStatusText}</Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={handleOpenMuteModal}
              disabled={!selectedNode}
              style={{ marginBottom: 8, height: 40 }}
              color="info"
            >
              {!selectedNode
                ? "Toggle Node Monitor"
                : muted
                ? "Unmute Node Monitor"
                : "Mute Node Monitor"}
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleOpenRotationModal}
              disabled={haProxyButtonDisabled}
              style={{ marginRight: 8, height: 40 }}
              color="warning"
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Checking HAProxy Status
                </>
              ) : getHaProxyStatusError ? (
                "Failed to fetch"
              ) : !haProxy || haProxyOnline === "n/a" ? (
                "No HAProxy"
              ) : (
                haProxyButtonText
              )}
            </Button>
          </Paper>
        </div>

        {getHaProxyStatusError && (
          <Alert severity="error">
            <AlertTitle>{"Error fetching HAProxy status"}</AlertTitle>
            {getHaProxyStatusError.message}
          </Alert>
        )}
      </Paper>
    </>
  );
}
