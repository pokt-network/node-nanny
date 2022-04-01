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
  IGetHostsChainsAndLoadBalancersQuery,
  useCreateNodeMutation,
} from "types";

interface HostsFormProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesForm({ formData, refetchNodes }: HostsFormProps) {
  const [chain, setChain] = useState("");
  const [host, setHost] = useState("");
  const [loadBalancers, setLoadBalancers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [port, setPort] = useState(0);
  const [backend, setBackend] = useState("");
  const [server, setServer] = useState("");
  const [haProxy, setHaproxy] = useState(true);

  const [submit] = useCreateNodeMutation({
    onCompleted: () => refetchNodes(),
    onError: (error) => console.log({ error }),
  });

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  const handleHostChange = (event: SelectChangeEvent<typeof host>) => {
    setHost(event.target.value);
  };

  const handleLoadBalancerChange = ({
    target,
  }: SelectChangeEvent<typeof loadBalancers>) => {
    const { value } = target;
    setLoadBalancers(typeof value === "string" ? value.split(",") : value);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
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
              {formData?.chains.map(({ name, id }) => (
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
              {formData?.hosts.map(({ name, id, location }) => (
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
                  .map(
                    (id) =>
                      formData?.loadBalancers!.find(({ id: lb }) => lb === id)!.name,
                  )
                  .join(", ");
              }}
            >
              {formData?.loadBalancers.map(({ name, id }) => (
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
              value={name}
              onChange={handleNameChange}
              label="Name"
              variant="outlined"
            />
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
                  name,
                  port,
                  server,
                  loadBalancers,
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
