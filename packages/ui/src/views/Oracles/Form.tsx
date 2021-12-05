import * as React from "react";
import { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Paper, Switch, Button, FormControl, TextField, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";

const GET_CHAINS = gql`
  {
    chains {
      id
      name
      type
    }
  }
`;

const CREATE_ORACLE = gql`
  mutation ($chain: String, $url: String) {
    createOracle(chain: $chain, url: $url) {
      id
      urls
    }
  }
`;

interface Chain {
  id: string;
  name: string;
  type: string;
}
interface ChainsData {
  chains: Chain[];
}

export function Form() {
  const [chain, setChain] = useState("");
  const [url, setUrl] = useState("");
  const [submit] = useMutation(CREATE_ORACLE);
  const { loading, error, data } = useQuery<ChainsData>(GET_CHAINS);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };
  if (loading) return <React.Fragment>Loading...</React.Fragment>;
  if (error) return <React.Fragment> Error! ${error.message}</React.Fragment>;
  return (
    <React.Fragment>
      <div>
        <Paper style={{ width: "200%" }} variant="outlined">
          <FormControl fullWidth>
            <Select placeholder="Select Chain" value={chain} onChange={handleChainChange}>
              {data?.chains.map(({ name, id }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
            <TextField value={url} onChange={handleUrlChange} label="URL" variant="outlined" />

            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
              }}
              variant="outlined"
              onClick={() => {
                submit({ variables: { chain, url } });
                setChain("");
                setUrl("");
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
