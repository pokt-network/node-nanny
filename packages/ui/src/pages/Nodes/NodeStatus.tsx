import { ChangeEvent, useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
} from "@mui/material";

import { GET_NODE_STATUS } from "queries";
import { IChain, IHost, INode } from "types";

interface INodeStatus {
  haProxyStatus: -1 | 0 | 1;
  muteStatus: boolean;
}

interface INodeStatusProps {
  selectedNode: INode;
}

export function NodeStatus({ selectedNode }: INodeStatusProps) {
  const [getStatus, { data, error, loading }] = useLazyQuery<INodeStatus>(GET_NODE_STATUS);

  useEffect(() => {
    getStatus({ variables: { id: selectedNode.id } });
  }, [selectedNode]);

  if (loading) return <>Loading...</>;
  if (error) return <> Error! ${error.message}</>;

  if (data) {
    const { haProxyStatus, muteStatus } = data;
    const haProxyStatusText = {
      "-1": "No HAProxy",
      "0": "OK",
      "1": "Offline",
    }[haProxyStatus];
    const muteStatusText = muteStatus ? "Muted" : "Not Muted";

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
              <Typography>Backend: {selectedNode?.backend}</Typography>
              <Typography>Port: {selectedNode?.port}</Typography>
              <Typography>Server: {selectedNode?.server}</Typography>
              <Typography>{selectedNode?.url}</Typography>
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
                  Restart HAProxy
                </Button>
                <div style={{ marginTop: "10px" }} />
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                >
                  Enable HAProxy
                </Button>
                <div style={{ marginTop: "10px" }} />
                <Button
                  fullWidth
                  style={{ display: "flex", justifyContent: "center" }}
                  variant="outlined"
                >
                  Mute HAProxy
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
