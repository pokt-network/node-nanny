import { ChangeEvent, useState } from "react";
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
} from "@mui/material";

import { IHostsQuery, useCreateHostMutation, useLocationsQuery } from "types";

interface HostsFormProps {
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
}

export function HostsForm({ refetchHosts }: HostsFormProps) {
  const [name, setName] = useState("");
  const [ip, setIP] = useState("");
  const [loadBalancer, setLoadBalancer] = useState(true);
  const [location, setLocation] = useState("NL");

  const { data, error, loading } = useLocationsQuery();
  const [submit] = useCreateHostMutation({ onCompleted: () => refetchHosts() });

  const handleLocationChange = (event: SelectChangeEvent<typeof location>) => {
    setLocation(event.target.value);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleIPChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIP(event.target.value);
  };

  const handleLBChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLoadBalancer(event.target.checked);
  };

  if (loading) return <>Loading...</>;
  if (error) return <>Error! ${error.message}</>;

  return (
    <>
      <div>
        <Paper style={{ width: "200%", padding: 10 }} variant="outlined">
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
              onClick={() => {
                submit({ variables: { name, ip, loadBalancer, location } });
                setLocation("");
                setName("");
                setIP("");
                setLoadBalancer(true);
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
