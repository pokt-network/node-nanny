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
  const { id, name, backend, frontend, port, server, url, muted } = selectedNode || {
    id: "",
    name: "",
    backend: "",
    frontend: "",
    port: "",
    server: "",
    url: "",
    muted: undefined,
  };

  /* ----- Delete Node ----- */
  const [submit] = useDeleteNodeMutation({
    onCompleted: () => {
      refetchNodes();
      ModalHelper.close();
    },
  });

  /* ----- Mute/Unmute Node ----- */
  const [muteMonitor] = useMuteMonitorMutation({
    onCompleted: ({ muteMonitor }) => {
      const { muted } = muteMonitor;
      setSelectedNode({ ...selectedNode!, muted });
    },
  });
  const [unmuteMonitor] = useUnmuteMonitorMutation({
    onCompleted: ({ unmuteMonitor }) => {
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...selectedNode!, muted });
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
  const [getStatus, { data, error, loading }] = useGetNodeStatusLazyQuery();
  const [enable] = useEnableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });
  const [disable] = useDisableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });

  useEffect(() => {
    if (selectedNode?.haProxy) getStatus({ variables: { id: selectedNode?.id } });
  }, [selectedNode, getStatus]);

  const haProxy = selectedNode?.haProxy;
  const haProxyOnline = { "0": true, "1": false }[String(data?.haProxyStatus)];
  const haProxyButtonEnabled =
    !loading && !error && haProxy && typeof haProxyOnline === "boolean";
  const haProxyStatusText = haProxyOnline ? "Online" : "Offline";
  const haProxyButtonText = `${haProxyOnline ? "Disable" : "Enable"} Node`;

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
        promptText: `Are you sure you wish to delete node ${selectedNode?.name}?`,
      },
    });
  };

  const handleOpenMuteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleMuteToggle(id),
        okText: `${muted ? "Unmute" : "Mute"} Node`,
        promptText: `Are you sure you wish to ${muted ? "unmute" : "mute"} node ${
          selectedNode?.name
        }?`,
      },
    });
  };

  const handleOpenRotationModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleHaProxyButtonClick(id),
        okText: `${haProxyOnline ? "Disable" : "Enable"} Node`,
        okColor: "error",
        cancelColor: "primary",
        promptText: `Are you sure you wish to ${haProxyOnline ? "remove" : "add"} node ${
          selectedNode?.name
        } ${haProxyOnline ? "from" : "to"} rotation?`,
      },
    });
  };

  return (
    <>
      <Paper style={{ padding: 10 }} variant="outlined">
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
            <Typography gutterBottom>URL: {url}</Typography>
            <div>
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
                ? "Toggle Monitor Alerts"
                : muted
                ? "Unmute Monitor Alerts"
                : "Mute Monitor Alerts"}
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleOpenRotationModal}
              disabled={!haProxyButtonEnabled}
              style={{ marginRight: 8, height: 40 }}
              color="warning"
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Checking HAProxy Status
                </>
              ) : error ? (
                "Failed to fetch"
              ) : haProxy ? (
                haProxyButtonText
              ) : (
                "No HAProxy"
              )}
            </Button>
          </Paper>
        </div>

        {error && (
          <Alert severity="error">
            <AlertTitle>{"Error fetching HAProxy status"}</AlertTitle>
            {error.message}
          </Alert>
        )}
      </Paper>
    </>
  );
}
