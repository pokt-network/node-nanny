import * as React from "react";
import { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Paper, Switch, Button, FormControl, TextField, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface Host {
  id: string;
  name: string;
  ip: string;
}
interface Chain {
  id: string;
  name: string;
  type: string;
}
interface HostsAndChainsData {
  chains: Chain[];
  hosts: Host[];
  loadBalancers: Host[];
}

const GET_HOSTS_CHAINS_LB = gql`
  query getHostsChainsAndLoadBalancers {
    hosts {
      id
      name
      ip
    }
    chains {
      id
      name
    }
    loadBalancers: hosts(loadBalancer: true) {
      id
      name
    }
  }
`;

const CREATE_NODE = gql`
  mutation (
    $backend: String
    $chain: ID
    $haProxy: Boolean
    $host: ID
    $port: Int
    $server: String
    $variance: Int
    $ssl: Boolean
    $basicAuth: String
    $url: String
    $loadBalancers: [ID]
  ) {
    createNode(
      input: {
        backend: $backend
        chain: $chain
        haProxy: $haProxy
        host: $host
        port: $port
        server: $server
        variance: $variance
        ssl: $ssl
        basicAuth: $basicAuth
        url: $url
        loadBalancers: $loadBalancers
      }
    ) {
      id
      url
    }
  }
`;

export function Form() {
  const [chain, setChain] = useState("");
  const [host, setHost] = useState("");
  const [ip, setIP] = useState("");
  const [loadBalancers, setLoadBalancer] = useState("");
  const [variance, setVariance] = useState(0);
  const [port, setPort] = useState(0);
  const [backend, setBackend] = useState("");
  const [server, setServer] = useState("");
  const [basicAuth, setAuth] = useState("");
  const [ssl, setSSL] = useState("");
  const [haProxy, setHaproxy] = useState(true);
  const [submit] = useMutation(CREATE_NODE);
  const { loading, error, data } = useQuery<HostsAndChainsData>(GET_HOSTS_CHAINS_LB);

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  const handleHostChange = (event: SelectChangeEvent<typeof host>) => {
    if (data?.hosts) {
      const index = data.hosts.findIndex((item) => item.id === event.target.value);
      const ip = data.hosts[index].ip;
      setIP(ip);
    }

    setHost(event.target.value);
  };

  const handleLoadBalancerChange = (event: SelectChangeEvent<typeof chain>) => {
    setLoadBalancer(event.target.value);
  };


  const handleVarianceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVariance(Number(event.target.value));
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPort(Number(event.target.value));
  };

  const handleBackendChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackend(event.target.value);
  };

  const handleServerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setServer(event.target.value);
  };
  const handleAuthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAuth(event.target.value);
  };

  const handleHaproxyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHaproxy(event.target.checked);
  };

  if (loading) return <React.Fragment>Loading...</React.Fragment>;
  if (error) return <React.Fragment> Error! ${error.message}</React.Fragment>;

  return (
    <React.Fragment>
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
            <TextField
              value={variance}
              onChange={handleVarianceChange}
              label="Variance"
              variant="outlined"
            />
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
                    variance,
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
    </React.Fragment>
  );
}
