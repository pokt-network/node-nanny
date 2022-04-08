import { ChangeEvent, useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Modal,
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
  useUpdateNodeMutation,
} from "types";

interface NodesUpdateProps {
  selectedNode: any;
  formData: IGetHostsChainsAndLoadBalancersQuery;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesUpdate({ selectedNode, formData, refetchNodes }: NodesUpdateProps) {
  const [chain, setChain] = useState("");
  const [host, setHost] = useState("");
  const [loadBalancers, setLoadBalancers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [port, setPort] = useState(0);
  const [backend, setBackend] = useState("");
  const [server, setServer] = useState("");
  const [haProxy, setHaproxy] = useState(true);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (formData && selectedNode) {
      const chain = formData!.chains!.find(
        ({ name }) => name === selectedNode.chain.name,
      )!.id;
      const host = formData!.hosts!.find(
        ({ name }) => name === selectedNode.host.name,
      )!.id;
      const loadBalancers = formData!
        .loadBalancers!.filter(({ name }) => selectedNode.loadBalancers.includes(name))
        .map(({ name }) => name);
      setChain(chain);
      setHost(host);
      setLoadBalancers(loadBalancers);
      setName(selectedNode.name);
      setPort(selectedNode.port);
      setBackend(selectedNode.backend);
      setServer(selectedNode.server);
      setHaproxy(selectedNode.haProxy);
    }
  }, [formData, selectedNode]);

  const [submit] = useUpdateNodeMutation({
    onCompleted: () => {
      refetchNodes();
      setChain("");
      setHost("");
      setLoadBalancers([]);
      setName("");
      setPort(0);
      setBackend("");
      setServer("");
      setHaproxy(false);
      handleClose();
    },
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

  const handleSubmitUpdateNode = () => {
    const update = {
      id: selectedNode!.id,
      backend,
      chain,
      haProxy,
      host,
      name,
      port,
      server,
      loadBalancers,
    };
    submit({ variables: { update } });
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outlined" disabled={!selectedNode}>
        Update Node
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Paper style={{ width: "100%", padding: 10 }} variant="outlined">
            <Typography align="center" variant="h6" gutterBottom>
              Update Node
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
              onClick={handleSubmitUpdateNode}
            >
              Submit
            </Button>
          </Paper>
        </div>
      </Modal>
    </>
  );
}
