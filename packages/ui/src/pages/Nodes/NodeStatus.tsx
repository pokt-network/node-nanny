import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  FormControl,
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
  selectedNode: INode | undefined;
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  setSelectedNode: Dispatch<SetStateAction<INode | undefined>>;
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
  const fetchHaProxy = Boolean(!selectedNode?.dispatch && selectedNode?.haProxy);

  const [haProxyButtonText, setHaProxyButtonText] = useState("Toggle HAProxy");

  const [getStatus, { data, error, loading }] = useGetNodeStatusLazyQuery({
    onCompleted: (data) => handleHaProxyButtonText(data.haProxyStatus),
  });
  const [enable] = useEnableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });
  const [disable] = useDisableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });

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

  const [submit] = useDeleteNodeMutation({
    onCompleted: () => {
      refetchNodes();
      ModalHelper.close();
    },
  });

  useEffect(() => {
    if (selectedNode) {
      if (fetchHaProxy) {
        getStatus({ variables: { id: selectedNode.id } });
      } else {
        setHaProxyButtonText("No HAProxy");
      }
    }
  }, [getStatus, selectedNode, fetchHaProxy]);

  const handleHaProxyButtonText = (haProxyStatus: number) => {
    setHaProxyButtonText(
      { "-1": "No HAProxy", 0: "Disable HAProxy", 1: "Enable HAProxy" }[haProxyStatus] ||
        "Toggle HAProxy",
    );
  };

  const handleHaProxyToggle = (id: string, haProxyStatus: number) =>
    haProxyStatus === 0 ? disable({ variables: { id } }) : enable({ variables: { id } });

  const handleMuteToggle = (id: string) =>
    muted ? unmuteMonitor({ variables: { id } }) : muteMonitor({ variables: { id } });

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
        promptText: `Are you sure you wish to delete node ${selectedNode?.name}?`,
      },
    });
  };

  const { haProxyStatus } = data || { haProxyStatus: 2 };
  const haProxyStatusText =
    {
      "-1": "No HAProxy",
      "0": "OK",
      "1": "Offline",
    }[haProxyStatus] || "No HAProxy";
  const muteStatusText = !selectedNode
    ? "No Node Selected"
    : muted
    ? "Muted"
    : "Not Muted";

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Paper style={{ width: 434, padding: 10 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            {!selectedNode ? "Select Node to view Status" : "Selected Node"}
          </Typography>
          <Paper style={{ padding: 10 }} variant="outlined">
            <Typography>Name: {name}</Typography>
            <Typography>{`${frontend ? "Frontend" : "Backend"}: ${
              (backend || frontend) ?? "None"
            }`}</Typography>
            <Typography>Port: {port}</Typography>
            <Typography>Server: {server ?? "None"}</Typography>
            <Typography>{url}</Typography>
          </Paper>
          <div style={{ marginTop: "10px" }} />
          <Paper style={{ padding: 10 }} variant="outlined">
            <>
              <Typography variant="h6">HAProxy Status: {haProxyStatusText}</Typography>
              <Typography variant="h6">Mute Status: {muteStatusText}</Typography>
            </>
          </Paper>
          <div style={{ marginTop: "10px" }} />
          <Paper
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              padding: 10,
            }}
            variant="outlined"
          >
            <FormControl fullWidth>
              <Button
                fullWidth
                style={{ display: "flex", justifyContent: "center", height: 40 }}
                variant="outlined"
                onClick={() => handleHaProxyToggle(id, haProxyStatus)}
                disabled={!!error || loading || !fetchHaProxy || haProxyStatus === -1}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} style={{ marginRight: 8 }} />
                    Checking HAProxy Status
                  </>
                ) : (
                  haProxyButtonText
                )}
              </Button>
              <div style={{ marginTop: "10px" }} />
              <Button
                fullWidth
                style={{ display: "flex", justifyContent: "center", height: 40 }}
                variant="outlined"
                onClick={() => handleMuteToggle(id)}
                disabled={!selectedNode}
              >
                {!selectedNode
                  ? "Togle Monitor Alerts"
                  : muted
                  ? "Unmute Monitor Alerts"
                  : "Mute Monitor Alerts"}
              </Button>
            </FormControl>
          </Paper>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Button
              onClick={handleOpenUpdateNodeModal}
              disabled={!selectedNode}
              variant="outlined"
            >
              Update Node
            </Button>
            <Button
              onClick={handleOpenDeleteModal}
              disabled={!selectedNode}
              variant="outlined"
            >
              Delete Node
            </Button>
          </div>
          {error && (
            <Alert severity="error">
              <AlertTitle>{"Error fetching HAProxy status"}</AlertTitle>
              {error.message}
            </Alert>
          )}
        </Paper>
      </div>
    </>
  );
}
