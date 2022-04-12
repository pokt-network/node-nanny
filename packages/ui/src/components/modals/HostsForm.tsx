import { ChangeEvent, useState, useEffect } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  IHost,
  IHostsQuery,
  ILocation,
  useCreateHostMutation,
  useUpdateHostMutation,
} from "types";
import { ModalHelper } from "utils";

interface HostsFormProps {
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
  locations: ILocation[];
  selectedHost?: IHost;
  update?: boolean;
}

export function HostsForm({
  refetchHosts,
  locations,
  selectedHost,
  update,
}: HostsFormProps) {
  const [location, setLocation] = useState("NL");
  const [name, setName] = useState("");
  const [ip, setIP] = useState("");
  const [ipDisabled, setIPDisabled] = useState(false);
  const [fqdn, setFQDN] = useState("");
  const [fqdnDisabled, setFQDNDisabled] = useState(false);
  const [loadBalancer, setLoadBalancer] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const input = {
    location,
    name,
    ip: ipDisabled ? "" : ip,
    fqdn: fqdnDisabled ? "" : fqdn,
    loadBalancer,
  };

  const [submitCreate] = useCreateHostMutation({
    variables: { input },
    onCompleted: () => {
      resetForm();
      refetchHosts();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateHostMutation({
    variables: { update: { id: selectedHost?.id, ...input } },
    onCompleted: () => {
      resetForm();
      refetchHosts();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    if (update && selectedHost) {
      setLocation(selectedHost.location.id);
      setName(selectedHost.name);
      setIP(selectedHost.ip!);
      setFQDN(selectedHost.fqdn!);
      setLoadBalancer(selectedHost.loadBalancer);
    }
  }, [update, selectedHost]);

  const handleSubmit = () => {
    setError("");
    setLoading(true);
    update ? submitUpdate() : submitCreate();
  };

  const resetForm = () => {
    setLocation("");
    setName("");
    setIP("");
    setFQDN("");
    setLoadBalancer(false);
  };

  useEffect(() => {
    if (fqdn) {
      setIPDisabled(true);
    } else {
      setIPDisabled(false);
    }
  }, [fqdn]);

  useEffect(() => {
    if (ip) {
      setFQDNDisabled(true);
    } else {
      setFQDNDisabled(false);
    }
  }, [ip]);

  const handleLocationChange = (event: SelectChangeEvent<typeof location>) => {
    setLocation(event.target.value);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleIPChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIP(event.target.value);
  };

  const handleFQDNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFQDN(event.target.value);
  };

  const handleLBChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLoadBalancer(event.target.checked);
  };

  return (
    <>
      <div>
        <Paper style={{ width: 700, padding: 32 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            {`${update ? "Update" : "Add New"} Host`}
          </Typography>
          <FormControl fullWidth>
            <Select value={location} onChange={handleLocationChange}>
              {locations?.map(({ id, name }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={name}
              onChange={handleNameChange}
              label="Host Name"
              variant="outlined"
            />
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={ip}
              onChange={handleIPChange}
              label="Host IP"
              variant="outlined"
              disabled={ipDisabled}
            />
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={fqdn}
              onChange={handleFQDNChange}
              label="Host FQDN"
              variant="outlined"
              disabled={fqdnDisabled}
            />
            <div>
              Load Balancer
              <Switch checked={loadBalancer} onChange={handleLBChange} />
            </div>

            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
                height: 40,
              }}
              variant="outlined"
              onClick={handleSubmit}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                `${update ? "Update" : "Create"} Host`
              )}
            </Button>
            {error && (
              <Alert severity="error">
                <AlertTitle>{`Error ${
                  update ? "Updating" : "Creating"
                } Host`}</AlertTitle>
                {error}
              </Alert>
            )}
          </FormControl>
        </Paper>
      </div>
    </>
  );
}
