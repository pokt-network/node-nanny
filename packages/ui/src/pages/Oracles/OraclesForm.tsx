import { ChangeEvent } from "react";
import { useState } from "react";
import {
  Paper,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";

import { useChainsQuery, useCreateOracleMutation } from "types";

export function OraclesForm() {
  const [chain, setChain] = useState("");
  const [url, setUrl] = useState("");

  const [submit] = useCreateOracleMutation();
  const { loading, error, data } = useChainsQuery();

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
        <Paper style={{ width: "200%", padding: 10 }} variant="outlined">
          <FormControl fullWidth>
            <InputLabel id="chain-label">Chain</InputLabel>
            <Select
              labelId="chain-label"
              value={chain}
              label="Chain"
              onChange={handleChainChange}
            >
              {data?.chains.map(({ name, id }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={url}
              onChange={handleUrlChange}
              label="URL"
              variant="outlined"
            />
            <div style={{ marginTop: "10px" }} />
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
