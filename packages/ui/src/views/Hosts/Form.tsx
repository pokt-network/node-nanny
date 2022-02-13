import * as React from "react";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Paper, Switch, Button, FormControl, TextField,  MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";

const CREATE_HOST = gql`
  mutation createHost($name: String, $ip: String, $loadBalancer: Boolean, $location: String) {
    createHost(name: $name, ip: $ip, loadBalancer: $loadBalancer, location: $location) {
      name
      ip
      loadBalancer
    }
  }
`;

const locations = ["NL", "DE", "USE1", "USE2", "USW2", "HK", "SG", "LDN"];

export function Form() {
  const [name, setName] = useState("");
  const [ip, setIP] = useState("");
  const [loadBalancer, setLoadBalancer] = useState(true);
  const [location, setLocation] = useState("NL");

  const [submit] = useMutation(CREATE_HOST);

  const handleLocationChange = (event: SelectChangeEvent<typeof location>) => {
    setLocation(event.target.value);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleIPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIP(event.target.value);
  };

  const handleLBChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoadBalancer(event.target.checked);
  };

  return (
    <React.Fragment>
      <div>
        <Paper style={{ width: "200%" }} variant="outlined">
          <FormControl fullWidth>
          <Select value={location} onChange={handleLocationChange}>
              {locations.map((location) => (
                <MenuItem value={location}>{location}</MenuItem>
              ))}
            </Select>
            <TextField
              value={name}
              onChange={handleNameChange}
              label="Host Name"
              variant="outlined"
            />
            <TextField value={ip} onChange={handleIPChange} label="Host IP" variant="outlined" />
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
                console.log({ name, ip, loadBalancer } as any);
                submit({ variables: { name, ip, loadBalancer, location } });
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
    </React.Fragment>
  );
}
