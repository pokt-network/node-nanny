import { useEffect, useState } from "react";
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

import { Table } from "components";
import { IHostCsvInput, IHostsQuery, ILocation, useCreateHostsCsvMutation } from "types";
import { ModalHelper, parseBackendError } from "utils";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

interface ICSVHost {
  name: string;
  location: string;
  loadBalancer?: string;
  ip?: string;
  fqdn?: string;
}

interface NodesCSVProps {
  locations: ILocation[];
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
}

export function HostsCSV({ locations, refetchHosts }: NodesCSVProps) {
  const [hosts, setHosts] = useState<IHostCsvInput[] | undefined>(undefined);
  const [hostsError, setHostsError] = useState<string>("");
  const [backendError, setBackendError] = useState<string>("");

  const [submit, { error, loading }] = useCreateHostsCsvMutation({
    onCompleted: () => {
      refetchHosts();
      ModalHelper.close();
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

  const validLocations = locations.map(({ name }) => name);
  const schema = {
    name: (name: string) => !!name && typeof name === "string",
    loadBalancer: (loadBalancer: string) =>
      typeof JSON.parse(loadBalancer) === "boolean" || !JSON.parse(loadBalancer),
    location: (location: string) => validLocations.includes(location.toUpperCase()),
    // DEV NOTE -> Fix Regex to validate IP is valid IP and FQDN is valid domain name.
    // ip: (ip: string) =>
    //   /'\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b'/.test(ip),
    // fqdn: (fqdn: string) =>
    //   /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(
    //     fqdn,
    //   ),
  };
  const validate = (host: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key]?.(host[key]));

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
        invalidHosts.push(
          `[${host.name}]: Host must have either an IP or a FQDN, but not both.`,
        );
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

  return (
    <div>
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Upload Hosts CSV
        </Typography>
        <CSVReader onFileLoaded={parseHostsCsv} parserOptions={{ header: true }} />
        {hostsError && (
          <Alert severity="error">
            <AlertTitle>
              Warning: Invalid fields detected. Please correct the following fields before
              attempting to upload Hosts CSV.
            </AlertTitle>
            {hostsError}
          </Alert>
        )}
        {backendError && (
          <Alert severity="error">
            <AlertTitle>Backend error: {backendError}</AlertTitle>
          </Alert>
        )}
        {hosts && (
          <>
            <Table
              type={`Adding ${hosts.length} Host${hosts.length === 1 ? "" : "s"}`}
              rows={hosts}
            />
            <Button
              disabled={Boolean(!hosts || hostsError || backendError)}
              style={{ marginTop: 8 }}
              onClick={submitCSV}
              variant="outlined"
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                `Add ${hosts.length} Host${hosts.length === 1 ? "" : "s"}`
              )}
            </Button>
          </>
        )}
      </Box>
    </div>
  );
}