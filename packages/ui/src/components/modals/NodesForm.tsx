import { ChangeEvent, useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  CircularProgress,
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
  INode,
  INodesQuery,
  IGetHostsChainsAndLoadBalancersQuery,
  useCreateNodeMutation,
  useUpdateNodeMutation,
} from "types";
import { ModalHelper } from "utils";

export interface NodesFormProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
  selectedNode?: INode;
  update?: boolean;
}

export function NodesForm({
  formData,
  refetchNodes,
  update,
  selectedNode,
}: NodesFormProps) {
  const [chain, setChain] = useState("");
  const [host, setHost] = useState("");
  const [https, setHttps] = useState(false);
  const [hostHasFqdn, setHostHasFqdn] = useState(false);
  const [loadBalancers, setLoadBalancers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [port, setPort] = useState(0);
  const [backend, setBackend] = useState("");
  const [server, setServer] = useState("");
  const [haProxy, setHaproxy] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const input = {
    https,
    chain,
    haProxy,
    host,
    name,
    port,
    loadBalancers,
    backend,
    server,
  };

  const [submitCreate] = useCreateNodeMutation({
    variables: { input },
    onCompleted: () => {
      resetForm();
      refetchNodes();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateNodeMutation({
    variables: { update: { id: selectedNode?.id, ...input } },
    onCompleted: () => {
      resetForm();
      refetchNodes();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const handleSubmit = () => {
    setError("");
    setLoading(true);
    update ? submitUpdate() : submitCreate();
  };

  const resetForm = () => {
    refetchNodes();
    setChain("");
    setHost("");
    setLoadBalancers([]);
    setName("");
    setPort(0);
    setBackend("");
    setServer("");
    setHaproxy(false);
  };

  useEffect(() => {
    if (update && selectedNode) {
      setChain(selectedNode.chain.id);
      setHost(selectedNode.host.id);
      setHttps(selectedNode.url.includes("https"));
      setLoadBalancers(selectedNode.loadBalancers.map(({ id }) => id));
      setName(selectedNode.name);
      setPort(selectedNode.port);
      setBackend(selectedNode.backend);
      setServer(selectedNode.server);
      setHaproxy(selectedNode.haProxy);
    }
  }, [update, selectedNode]);

  useEffect(() => {
    if (formData?.hosts && host) {
      const hostHasFqdn = Boolean(formData.hosts.find(({ id }) => id === host)?.fqdn);
      if (!hostHasFqdn) {
        setHttps(false);
      }
      setHostHasFqdn(hostHasFqdn);
    }
  }, [host, formData]);

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  const handleHostChange = (event: SelectChangeEvent<typeof host>) => {
    setHost(event.target.value);
  };

  const handleHttpsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHttps(event.target.checked);
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
        <Paper style={{ width: 700, padding: 32 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            {`${update ? "Update" : "Add New"} Node`}
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
                  {`${name} - ${location.name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              HTTPS
              <Switch
                checked={https}
                onChange={handleHttpsChange}
                disabled={!hostHasFqdn}
              />
              {host && (
                <Typography>
                  {hostHasFqdn
                    ? "Selected host has an FQDN; HTTPS may be enabled."
                    : "Selected host does not have an FQDN; HTTPS is disabled."}
                </Typography>
              )}
            </div>
          </div>
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
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              HAproxy
              <Switch checked={haProxy} onChange={handleHaproxyChange} />
            </div>
          </div>

          <Button
            fullWidth
            style={{
              display: "flex",
              justifyContent: "center",
              height: 40,
            }}
            variant="outlined"
            onClick={() => handleSubmit()}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              `${update ? "Update" : "Create"} Node`
            )}
          </Button>
          {error && (
            <Alert severity="error">
              <AlertTitle>{`Error ${update ? "Updating" : "Creating"} Node`}</AlertTitle>
              {error}
            </Alert>
          )}
        </Paper>
      </div>
    </>
  );
}
