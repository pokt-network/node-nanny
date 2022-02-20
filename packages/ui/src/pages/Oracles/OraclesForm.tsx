import { ChangeEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Paper,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";

import { CREATE_ORACLE, GET_ALL_CHAINS } from "queries";

interface Chain {
  id: string;
  name: string;
  type: string;
}
interface ChainsData {
  chains: Chain[];
}

export function OraclesForm() {
  const [chain, setChain] = useState("");
  const [url, setUrl] = useState("");
  const [submit] = useMutation(CREATE_ORACLE);
  const { loading, error, data } = useQuery<ChainsData>(GET_ALL_CHAINS);

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  if (loading) return <>Loading...</>;
  if (error) return <> Error! ${error.message}</>;

  return (
    <>
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
    </>
  );
}
