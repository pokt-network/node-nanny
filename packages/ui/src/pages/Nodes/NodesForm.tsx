import { ChangeEvent, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
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
  Typography,
} from "@mui/material";

import {
  INodesQuery,
  useCreateNodeMutation,
  useGetHostsChainsAndLoadBalancersQuery,
} from "types";

interface HostsFormProps {
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesForm({ refetchNodes }: HostsFormProps) {
  const [chain, setChain] = useState("");
  const [host, setHost] = useState("");
  const [ip, setIp] = useState("");
  const [loadBalancers, setLoadBalancers] = useState<string[]>([]);
  const [port, setPort] = useState(0);
  const [backend, setBackend] = useState("");
  const [server, setServer] = useState("");
  const [haProxy, setHaproxy] = useState(true);

  const { loading, error, data } = useGetHostsChainsAndLoadBalancersQuery();
  const [submit] = useCreateNodeMutation({
    onCompleted: () => refetchNodes(),
    onError: (error) => console.log({ error }),
  });

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  const handleHostChange = (event: SelectChangeEvent<typeof host>) => {
    if (data?.hosts) {
      const { ip } = data.hosts.find(({ id }) => id === event.target.value)!;
      setIp(ip!);
      console.log({ ip });
    }

    setHost(event.target.value);
  };

  const handleLoadBalancerChange = ({
    target,
  }: SelectChangeEvent<typeof loadBalancers>) => {
    const { value } = target;
    setLoadBalancers(typeof value === "string" ? value.split(",") : value);
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

  const handleHaproxyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHaproxy(event.target.checked);
  };

  if (loading) return <>Loading...</>;
  if (error) return <> Error! ${error.message}</>;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Paper style={{ width: "200%", padding: 10 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            Add New Node
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="chain-label">Chain</InputLabel>
            <Select
              labelId="chain-label"
              value={chain}
              label="Chain"
              onChange={handleChainChange}
            >
              {data?.chains.map(({ name, id }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <InputLabel id="host-label">Host</InputLabel>
            <Select
              labelId="host-label"
              value={host}
              label="Host"
              onChange={handleHostChange}
            >
              {data?.hosts.map(({ name, id, location }) => (
                <MenuItem key={id} value={id}>
                  {`${name} - ${location}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <InputLabel id="lb-label">Load Balancers</InputLabel>
            <Select
              multiple
              labelId="lb-label"
              value={loadBalancers}
              onChange={handleLoadBalancerChange}
              input={<OutlinedInput label="Load Balancers" />}
              renderValue={(selected) => {
                return selected
                  .map((id) => data?.loadBalancers!.find(({ id: lb }) => lb === id)!.name)
                  .join(", ");
              }}
            >
              {data?.loadBalancers.map(({ name, id }) => (
                <MenuItem key={id} value={id}>
                  <Checkbox checked={loadBalancers.indexOf(id!) > -1} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              value={port}
              onChange={handlePortChange}
              label="Port"
              variant="outlined"
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              value={backend}
              onChange={handleBackendChange}
              label="Backend"
              variant="outlined"
            />
          </FormControl>

          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              value={server}
              onChange={handleServerChange}
              label="Server"
              variant="outlined"
            />
          </FormControl>
          <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
          >
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
                  loadBalancers,
                  url: `http://${ip}:${port}`,
                },
              });
            }}
          >
            Submit
          </Button>
        </Paper>
      </div>
    </>
  );
}
