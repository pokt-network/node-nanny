import { useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";

import {
  IWebhooksQuery,
  useChainsQuery,
  useCreateWebhookMutation,
  useLocationsQuery,
} from "types";

interface WebhooksFormProps {
  refetchWebhooks: (variables?: any) => Promise<ApolloQueryResult<IWebhooksQuery>>;
}

export function WebhooksForm({ refetchWebhooks }: WebhooksFormProps) {
  const [chain, setChain] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");

  const {
    data: chainsData,
    loading: chainsLoading,
    error: chainsError,
  } = useChainsQuery();
  const {
    data: locationsData,
    loading: locationsLoading,
    error: locationsError,
  } = useLocationsQuery();
  const [submit] = useCreateWebhookMutation({
    onCompleted: () => refetchWebhooks(),
  });

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };
  const handleLocationChange = (event: SelectChangeEvent<typeof location>) => {
    setLocation(event.target.value);
  };

  const handleChainChange = (event: SelectChangeEvent<typeof chain>) => {
    setChain(event.target.value);
  };

  if (chainsLoading || locationsLoading) return <>Loading...</>;
  if (chainsError || locationsError)
    return <> Error! ${chainsError?.message || locationsError?.message}</>;

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
              {chainsData?.chains.map(({ name, id }) => (
                <MenuItem key={id} value={name!}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              value={url}
              onChange={handleUrlChange}
              label="URL"
              variant="outlined"
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <InputLabel id="location-label">Location</InputLabel>
            <Select
              labelId="location-label"
              value={location}
              label="Location"
              onChange={handleLocationChange}
            >
              {locationsData?.locations.map(({ id, name }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <Button
            fullWidth
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            variant="outlined"
            onClick={() => {
              submit({ variables: { chain, url, location } });
              setChain("");
              setUrl("");
              setLocation("");
            }}
          >
            Submit
          </Button>
        </Paper>
      </div>
    </>
  );
}
