import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { Button, CircularProgress, FormControl, Paper, Typography } from "@mui/material";

import {
  DISABLE_HAPROXY,
  ENABLE_HAPROXY,
  GET_NODE_STATUS,
  MUTE_MONITOR,
  REBOOT_SERVER,
  UNMUTE_MONITOR,
} from "queries";
import { INode } from "types";

interface INodeStatus {
  haProxyStatus: -1 | 0 | 1;
}

interface INodeStatusProps {
  selectedNode: INode;
  setSelectedNode: Dispatch<React.SetStateAction<INode | undefined>>;
}

export function NodeStatus({ selectedNode, setSelectedNode }: INodeStatusProps) {
  const { id, backend, port, server, url, muted } = selectedNode;

  const [rebooting, setRebooting] = useState<boolean>(false);

  const [getStatus, { data, error, loading }] =
    useLazyQuery<INodeStatus>(GET_NODE_STATUS);
  const [rebootServer] = useMutation<boolean>(REBOOT_SERVER, {
    onCompleted: () => {
      setTimeout(() => {
        getStatus();
        setRebooting(false);
      }, 10000);
    },
    // DEV NOTE -> Add error display to UI
    onError: (_error) => setRebooting(false),
  });
  const [enable] = useMutation<boolean>(ENABLE_HAPROXY, {
    onCompleted: () => getStatus(),
  });
  const [disable] = useMutation<boolean>(DISABLE_HAPROXY, {
    onCompleted: () => getStatus(),
  });

  const [muteMonitor] = useMutation<{ muteMonitor: INode }>(MUTE_MONITOR, {
    onCompleted: ({ muteMonitor }) => {
      const { muted } = muteMonitor;
      setSelectedNode({ ...selectedNode, muted });
    },
  });
  const [unmuteMonitor] = useMutation<{ unmuteMonitor: INode }>(UNMUTE_MONITOR, {
    onCompleted: ({ unmuteMonitor }) => {
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...selectedNode, muted });
    },
  });

  useEffect(() => {
    getStatus({ variables: { id: selectedNode.id } });
  }, [getStatus]);

  const handleRebootServer = (id: string): void => {
    if (!rebooting) {
      setRebooting(true);
      rebootServer({ variables: { id } });
    }
  };

  const handleHaProxyToggle = (id: string, haProxyStatus: -1 | 0 | 1) =>
    haProxyStatus === 0 ? disable({ variables: { id } }) : enable({ variables: { id } });

  const handleMuteToggle = (id: string) => {
    console.log("FIRING MUTE UNMUTE", muted);
    muted ? unmuteMonitor({ variables: { id } }) : muteMonitor({ variables: { id } });
  };

  if (loading) return <>Loading...</>;
  if (error) return <> Error! ${error.message}</>;

  if (data) {
    const { haProxyStatus } = data;
    const haProxyStatusText = {
      "-1": "No HAProxy",
      "0": "OK",
      "1": "Offline",
    }[haProxyStatus];
    const muteStatusText = muted ? "Muted" : "Not Muted";

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
              Selected Node
            </Typography>
            <Paper style={{ padding: 10 }} variant="outlined">
              <Typography>Backend: {backend}</Typography>
              <Typography>Port: {port || "None"}</Typography>
              <Typography>Server: {server || "None"}</Typography>
              <Typography>{url}</Typography>
            </Paper>
            <div style={{ marginTop: "10px" }} />
            <Paper style={{ padding: 10 }} variant="outlined">
              {rebooting ? (
                <Typography variant="h4">Rebooting...</Typography>
              ) : (
                <>
                  <Typography variant="h6">
                    HAProxy Status: {haProxyStatusText}
                  </Typography>
                  <Typography variant="h6">Mute Status: {muteStatusText}</Typography>
                </>
              )}
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
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                  onClick={() => handleRebootServer(id)}
                  disabled={haProxyStatus !== 0}
                >
                  {rebooting ? (
                    <>
                      <CircularProgress size={20} sx={{ marginRight: "8px" }} />
                      Rebooting Server...
                    </>
                  ) : (
                    "Reboot Server"
                  )}
                </Button>
                <div style={{ marginTop: "10px" }} />
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                  onClick={() => handleHaProxyToggle(id, haProxyStatus)}
                  disabled={haProxyStatus === -1}
                >
                  {
                    { "-1": "No HAProxy", 0: "Disable HAProxy", 1: "Enable HAProxy" }[
                      haProxyStatus
                    ]
                  }
                </Button>
                <div style={{ marginTop: "10px" }} />
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                  onClick={() => handleMuteToggle(id)}
                >
                  {muted ? "Unmute Monitor" : "Mute Monitor"}
                </Button>
              </FormControl>
            </Paper>
          </Paper>
        </div>
      </>
    );
  }

  return <></>;
}
