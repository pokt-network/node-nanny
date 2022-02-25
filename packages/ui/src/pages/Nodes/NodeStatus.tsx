import { ChangeEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
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
  TextField,
} from "@mui/material";

// import { CREATE_NODE, GET_HOSTS_CHAINS_LB } from "queries";
import { IChain, IHost, INode } from "types";

interface HostsAndChainsData {
  chains: IChain[];
  hosts: IHost[];
  loadBalancers: IHost[];
}

export function NodeStatus() {
  // if (loading) return <>Loading...</>;
  // if (error) return <> Error! ${error.message}</>;

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
        <Paper style={{ width: "200%", padding: 10 }} variant="outlined">
          <Paper style={{ width: "100%", padding: 10 }} variant="outlined">
            Node Status
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
