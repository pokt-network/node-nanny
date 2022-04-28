import { Dispatch, useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import CSVReader from "react-csv-reader";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import { Table, Title } from "components";
import Paper from "components/Paper";
import { IHostCsvInput, IHostsQuery, ILocation, useCreateHostsCsvMutation } from "types";
import { parseBackendError, regexTest, s } from "utils";
import { HostActionsState } from "pages/Hosts";

interface ICSVHost {
  name: string;
  location: string;
  loadBalancer?: string;
  ip?: string;
  fqdn?: string;
}

interface NodesCSVProps {
  locations: ILocation[];
  hostNames: string[];
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
  setState: Dispatch<HostActionsState>
}

export const HostsCSV = ({ locations, hostNames, refetchHosts, setState }: NodesCSVProps) => {
  const [hosts, setHosts] = useState<IHostCsvInput[]>(undefined);
  const [hostsError, setHostsError] = useState<string>("");
  const [backendError, setBackendError] = useState<string>("");

  /* ----- Table Options ---- */
  const columnsOrder = ["name", "location", "ip", "fqdn", "loadBalancer"];

  /* ----- CSV Validation ----- */
  const validLocations = locations?.map(({ name }) => name);
  const schema = {
    name: (name: string) => !!name && typeof name === "string",
    loadBalancer: (loadBalancer: string) =>
      typeof JSON.parse(loadBalancer) === "boolean" || !JSON.parse(loadBalancer),
    location: (location: string) => validLocations?.includes(location.toUpperCase()),
    ip: (ip: string) => !ip || regexTest(ip, "ip"),
    fqdn: (fqdn: string) => !fqdn || regexTest(fqdn, "fqdn"),
  };
  const validate = (host: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key]?.(host[key]));

  /* ----- CSV Parsing ----- */
  const parseHostsCsv = (hostsData: ICSVHost[]) => {
    setHostsError("");
    setBackendError("");
    const hostsWithRequiredFields = hostsData.filter((host) =>
      ["name", "location"].every((key) => Object.keys(host).includes(key)),
    );

    const invalidHosts: any = [];
    const parsedHosts = hostsWithRequiredFields.map((host: any) => {
      const invalidFields = validate(host, schema);
      if (invalidFields.length) {
        invalidHosts.push(`[${host.name}]: ${invalidFields.join(", ")}`);
      }
      if (!host.fqdn && !host.ip) {
        invalidHosts.push(`[${host.name}]: Host must have either an IP or a FQDN.`);
      }
      if (hostNames.includes(host.name)) {
        invalidHosts.push(`[${host.name}]: Host name is already taken.`);
      }
      if (host.fqdn && host.ip) {
        invalidHosts.push(`[${host.name}]: Host may only have FQDN or IP, not both.`);
      }

      return {
        ...host,
        ip: host.ip || null,
        fqdn: host.fqdn || null,
        loadBalancer: host.loadBalancer
          ? JSON.parse(host.loadBalancer)
          : host.loadBalancer,
      };
    });

    if (invalidHosts.length) {
      setHostsError(invalidHosts.join("\n"));
      setHosts(parsedHosts);
    } else {
      setHosts(parsedHosts);
    }
  };

  /* ----- Submit Mutation ----- */
  const [submit, { error, loading }] = useCreateHostsCsvMutation({
    onCompleted: () => {
      refetchHosts();
      setState(HostActionsState.Info)
    },
  });

  useEffect(() => {
    if (error) {
      setBackendError(parseBackendError(error));
    }
  }, [error]);

  const submitCSV = () => {
    if (!hostsError && !backendError && hosts) {
      submit({ variables: { hosts } });
    }
  };

  /* ----- Layout ----- */
  return (
    <Paper>
      <Title>Upload Hosts CSV</Title>
      <CSVReader onFileLoaded={parseHostsCsv} parserOptions={{ header: true }} />
      {hostsError && (
        <Alert severity="error" style={{ overflow: "scroll", maxHeight: 200 }}>
          <AlertTitle>
            Warning: Invalid fields detected. Please correct the following fields before
            attempting to upload Hosts CSV.
          </AlertTitle>
          {hostsError.includes("\n") ? (
            hostsError.split("\n").map((error) => <Typography>{error}</Typography>)
          ) : (
            <Typography>{hostsError}</Typography>
          )}
        </Alert>
      )}
      {backendError && (
        <Alert severity="error">
          <AlertTitle>Backend error: {backendError}</AlertTitle>
        </Alert>
      )}
      {hosts && (
        <Table
          type={`Adding ${hosts.length} Host${hosts.length === 1 ? "" : "s"}`}
          rows={hosts}
          columnsOrder={columnsOrder}
          height={400}
        />
      )}
      <Box
        sx={{ 
          marginTop: 4,
          textAlign: "center",
          '& button': { margin: 1 }
        }}
      >
        <Button
          disabled={Boolean(!hosts || hostsError || backendError)}
          onClick={submitCSV}
          variant="contained"
          color="primary"
        >
          {loading ? (
            <CircularProgress size={20} style={{ color: "white" }} />
          ) : !hosts?.length ? (
            "No hosts"
          ) : (
            `Add ${hosts.length} Host${s(hosts.length)}`
          )}
        </Button>
        <Button
          onClick={() => setState(HostActionsState.Info)}
          variant="outlined"
          color="error"
        >
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}

export default HostsCSV