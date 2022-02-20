import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";

import { CREATE_WEBHOOK, GET_ALL_CHAINS } from "queries";

const locations = ["NL", "DE", "USE1", "USE2", "USW2", "HK", "SG", "LDN"];

interface Chain {
  id: string;
  name: string;
  type: string;
}
interface ChainsData {
  chains: Chain[];
}

export function WebhooksForm() {
  const [chain, setChain] = useState("");
  const [url, setUrl] = useState("");
  const [submit] = useMutation(CREATE_WEBHOOK);
  const [location, setLocation] = useState("NL");

  const { loading, error, data } = useQuery<ChainsData>(GET_ALL_CHAINS);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };
  const handleLocationChange = (event: SelectChangeEvent<typeof location>) => {
    setLocation(event.target.value);
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
            <Select value={location} onChange={handleLocationChange}>
              {locations.map((location) => (
                <MenuItem value={location}>{location}</MenuItem>
              ))}
            </Select>
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
                // setChain("");
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
