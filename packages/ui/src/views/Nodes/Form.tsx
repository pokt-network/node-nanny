import * as React from "react";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Paper, Switch, Button, FormControl, TextField } from "@mui/material";

const GET_HOSTS = gql`
  {
    hosts {
      id
      ip
      name
      loadBalancer
    }
  }
`;
const GET_CHAINS = gql`
  {
    chains {
      id
      name
      type
    }
  }
`;

const CREATE_HOST = gql`
  mutation createHost($name: String, $ip: String, $loadBalancer: Boolean) {
    createHost(name: $name, ip: $ip, loadBalancer: $loadBalancer) {
      name
      ip
      loadBalancer
    }
  }
`;

export function Form() {
  const [name, setName] = useState("");
  const [ip, setIP] = useState("");
  const [loadBalancer, setLoadBalancer] = useState(true);
  const [submit, { data, loading, error }] = useMutation(CREATE_HOST);
  const label = { inputProps: { "aria-label": "lb swtich" } };

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
                submit({ variables: { name, ip, loadBalancer } });
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
