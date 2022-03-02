import { useState } from "react";
import {
  useMutation,
  useQuery,
  ApolloQueryResult,
  OperationVariables,
} from "@apollo/client";
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

import { CREATE_WEBHOOK, GET_ALL_CHAINS } from "queries";
import { IChain, IWebhook } from "types";

const locations = ["NL", "DE", "USE1", "USE2", "USW2", "HK", "SG", "LDN"];

interface WebhooksFormProps {
  refetchWebhooks: (variables?: Partial<OperationVariables> | undefined) => Promise<
    ApolloQueryResult<{
      webhooks: IWebhook[];
    }>
  >;
}

export function WebhooksForm({ refetchWebhooks }: WebhooksFormProps) {
  const [chain, setChain] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");

  const [submit] = useMutation<{ createWebhook: IWebhook }>(CREATE_WEBHOOK, {
    onCompleted: () => refetchWebhooks(),
  });
  const { loading, error, data } = useQuery<{ chains: IChain[] }>(GET_ALL_CHAINS);

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
              {locations.map((location) => (
                <MenuItem key={location} value={location}>
                  {location}
                </MenuItem>
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
