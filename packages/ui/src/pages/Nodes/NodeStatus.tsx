import { useEffect } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { Button, FormControl, Paper, Typography } from "@mui/material";

import {
  DISABLE_HAPROXY_SERVER,
  ENABLE_HAPROXY_SERVER,
  GET_NODE_STATUS,
  MUTE_MONITOR,
  UNMUTE_MONITOR,
} from "queries";
import { INode } from "types";

interface INodeStatus {
  haProxyStatus: -1 | 0 | 1;
  muted: boolean;
}

interface INodeStatusProps {
  selectedNode: INode;
}

export function NodeStatus({ selectedNode }: INodeStatusProps) {
  const [getStatus, { data, error, loading }] = useLazyQuery<INodeStatus>(GET_NODE_STATUS);
  const onCompleted = () => getStatus();
  const [enableHaProxy] = useMutation<boolean>(ENABLE_HAPROXY_SERVER, { onCompleted });
  const [disableHaProxy] = useMutation<boolean>(DISABLE_HAPROXY_SERVER, { onCompleted });
  const [muteMonitor] = useMutation<boolean>(MUTE_MONITOR, { onCompleted });
  const [unmuteMonitor] = useMutation<boolean>(UNMUTE_MONITOR, { onCompleted });

  useEffect(() => {
    const { id } = selectedNode;
    getStatus({ variables: { id } });
  }, [getStatus, selectedNode]);

  if (loading) return <>Loading...</>;
  if (error) return <> Error! ${error.message}</>;

  if (data && selectedNode) {
    const { haProxyStatus, muted } = data;
    const { id, backend, port, server, url } = selectedNode;

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
              <Typography variant="h6">HAProxy Status: {haProxyStatusText}</Typography>
              <Typography variant="h6">Mute Status: {muteStatusText}</Typography>
            </Paper>
            <div style={{ marginTop: "10px" }} />
            <Paper
              style={{ display: "flex", flexDirection: "column", width: "100%", padding: 10 }}
              variant="outlined"
            >
              <FormControl fullWidth>
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                >
                  Reboot Server
                </Button>
                <div style={{ marginTop: "10px" }} />
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                  onClick={() =>
                    haProxyStatus === 0
                      ? disableHaProxy({ variables: { id } })
                      : enableHaProxy({ variables: { id } })
                  }
                  disabled={haProxyStatus === -1}
                >
                  {{ "-1": "No HAProxy", 0: "Disable HAProxy", 1: "Enable HAProxy" }[haProxyStatus]}
                </Button>
                <div style={{ marginTop: "10px" }} />
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                  onClick={() =>
                    muted
                      ? unmuteMonitor({ variables: { id } })
                      : muteMonitor({ variables: { id } })
                  }
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
