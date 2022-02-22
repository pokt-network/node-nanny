import { ChangeEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
} from "@mui/material";

import { CREATE_NODE, GET_HOSTS_CHAINS_LB } from "queries";
import { IChain, IHost, INode } from "types";

interface HostsAndChainsData {
  chains: IChain[];
  hosts: IHost[];
  loadBalancers: IHost[];
}

export function NodesForm() {
  const [chain, setChain] = useState("");
  const [host, setHost] = useState("");
  const [ip, setIP] = useState("");
  const [loadBalancers, setLoadBalancer] = useState("");
  const [port, setPort] = useState(0);
  const [backend, setBackend] = useState("");
  const [server, setServer] = useState("");
  const [basicAuth, setAuth] = useState("");
  const [ssl, setSSL] = useState("");
  const [haProxy, setHaproxy] = useState(true);

  const [submit] = useMutation<{ createNode: INode }>(CREATE_NODE);
  const { loading, error, data } = useQuery<HostsAndChainsData>(GET_HOSTS_CHAINS_LB);

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  const handleHostChange = (event: SelectChangeEvent<typeof host>) => {
    if (data?.hosts) {
      const index = data.hosts.findIndex((item) => item.id === event.target.value);
      const ip = data.hosts[index].ip;
      setIP(ip!);
    }

    setHost(event.target.value);
  };

  const handleLoadBalancerChange = (event: SelectChangeEvent<typeof chain>) => {
    setLoadBalancer(event.target.value);
  };

  const handlePortChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPort(Number(event.target.value));
  };

  const handleBackendChange = (event: ChangeEvent<HTMLInputElement>) => {
    setBackend(event.target.value);
  };

  const handleServerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setServer(event.target.value);
  };
  const handleAuthChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAuth(event.target.value);
  };

  const handleHaproxyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHaproxy(event.target.checked);
  };

  if (loading) return <>Loading...</>;
  if (error) return <> Error! ${error.message}</>;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexWrap: "wrap",
          padding: "10px",
          columnGap: "10px",
          rowGap: "10px",
        }}
      >
        <Paper style={{ width: "200%" }} variant="outlined">
          <FormControl fullWidth>
            <Select value={chain} onChange={handleChainChange}>
              {data?.chains.map(({ name, id }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
            <div style={{ marginTop: "10px" }} />
            <Select value={host} onChange={handleHostChange}>
              {data?.hosts.map(({ name, id }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>

            <div style={{ marginTop: "10px" }} />
            <Select value={loadBalancers} onChange={handleLoadBalancerChange}>
              {data?.loadBalancers.map(({ name, id }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
            <div style={{ marginTop: "10px" }} />
            <TextField value={port} onChange={handlePortChange} label="Port" variant="outlined" />
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={backend}
              onChange={handleBackendChange}
              label="Backend"
              variant="outlined"
            />
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={server}
              onChange={handleServerChange}
              label="Server"
              variant="outlined"
            />
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={basicAuth}
              onChange={handleAuthChange}
              label="Auth String"
              variant="outlined"
            />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div>
                HAproxy
                <Switch checked={haProxy} onChange={handleHaproxyChange} />
              </div>
            </div>

            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
              }}
              variant="outlined"
              onClick={() => {
                submit({
                  variables: {
                    backend,
                    chain,
                    haProxy,
                    host,
                    port,
                    server,
                    basicAuth,
                    loadBalancers: [loadBalancers],
                    url: `http://${ip}:${port}`,
                  },
                });
              }}
            >
              Submit
            </Button>
          </FormControl>
        </Paper>
      </div>
    </>
  );
}
