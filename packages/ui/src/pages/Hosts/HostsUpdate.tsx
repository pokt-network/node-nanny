import { ChangeEvent, useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Button,
  FormControl,
  TextField,
  MenuItem,
  Modal,
} from "@mui/material";

import { IHostsQuery, useUpdateHostMutation, useLocationsQuery } from "types";

interface HostsFormProps {
  selectedHost: any;
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
}

export function HostsUpdate({ selectedHost, refetchHosts }: HostsFormProps) {
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [ip, setIP] = useState("");
  const [fqdn, setFQDN] = useState("");
  const [loadBalancer, setLoadBalancer] = useState<boolean | undefined>(undefined);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const { data, error, loading } = useLocationsQuery();
  useEffect(() => {
    if (data && selectedHost) {
      const location = data!.locations!.find(
        ({ name }) => name === selectedHost.location,
      )!.id;
      setLocation(location);
      setName(selectedHost.name);
      setIP(selectedHost.ip!);
      setFQDN(selectedHost.fqdn!);
      setLoadBalancer(selectedHost.loadBalancer);
    }
  }, [data, selectedHost]);

  const [submit] = useUpdateHostMutation({
    onCompleted: () => {
      refetchHosts();
      setLocation("");
      setName("");
      setIP("");
      setFQDN("");
      setLoadBalancer(false);
      handleClose();
    },
  });

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

  if (loading) return <>Loading...</>;
  if (error) return <>Error! ${error.message}</>;

  const handleSubmitUpdateHost = () => {
    const update = { id: selectedHost!.id, location, name, ip, fqdn, loadBalancer };
    submit({ variables: { update } });
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outlined" disabled={!selectedHost}>
        Update Host
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div>
          <Paper style={{ width: "100%", padding: 10 }} variant="outlined">
            <FormControl fullWidth>
              <Select value={location} onChange={handleLocationChange}>
                {data?.locations.map(({ id, name }) => (
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
              />
              <div style={{ marginTop: "10px" }} />
              <TextField
                value={fqdn}
                onChange={handleFQDNChange}
                label="Host FQDN"
                variant="outlined"
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
                }}
                variant="outlined"
                onClick={handleSubmitUpdateHost}
              >
                Submit
              </Button>
            </FormControl>
          </Paper>
        </div>
      </Modal>
    </>
  );
}
