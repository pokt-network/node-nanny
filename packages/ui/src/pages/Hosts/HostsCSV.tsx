import { useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import CSVReader from "react-csv-reader";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
} from "@mui/material";

import { Table } from "components";
import {
  ILocationsQuery,
  IHostCsvInput,
  IHostsQuery,
  useCreateHostsCsvMutation,
} from "types";
import { parseBackendError } from "utils";

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
  locationsData: ILocationsQuery;
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
}

export function HostsCSV({ locationsData: { locations }, refetchHosts }: NodesCSVProps) {
  const [open, setOpen] = useState(false);
  const [hosts, setHosts] = useState<IHostCsvInput[] | undefined>(undefined);
  const [hostsError, setHostsError] = useState<string>("");
  const [backendError, setBackendError] = useState<string>("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [submit, { error, loading }] = useCreateHostsCsvMutation({
    onCompleted: () => {
      refetchHosts();
      handleClose();
    },
  });

  useEffect(() => {
    if (error) {
      setBackendError(parseBackendError(error));
    }
  }, [error]);

  const submitCSV = () => {
    if (hosts) {
      submit({ variables: { hosts } });
    }
  };

  const validLocations = locations.map(({ name }) => name);
  const schema = {
    name: (value: string) => !!value && typeof value === "string",
    loadBalancer: (value: string) =>
      typeof JSON.parse(value) === "boolean" || !JSON.parse(value),
    location: (value: string) => validLocations.includes(value.toUpperCase()),
    // ip: (value: string) =>
    //   /'\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b'/.test(value),
    // fqdn: (value: string) =>
    //   /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(
    //     value,
    //   ),
  };
  const validate = (object: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key]?.(object[key]));

  const parseHostsCsv = (hostsData: ICSVHost[]) => {
    const hostsWithRequiredFields = hostsData.filter((host) =>
      ["name", "location"].every((key) => Object.keys(host).includes(key)),
    );

    const invalidHosts: any = [];
    const parsedHosts = hostsWithRequiredFields.map((host: any) => {
      const invalidFields = validate(host, schema);
      if (invalidFields.length) {
        invalidHosts.push(`[${host.name}]: ${invalidFields.join(", ")}`);
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
    } else {
      setHosts(parsedHosts);
    }
  };

  return (
    <div>
      <Button onClick={handleOpen} variant="outlined">
        Upload CSV
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Upload Hosts CSV
          </Typography>
          <CSVReader onFileLoaded={parseHostsCsv} parserOptions={{ header: true }} />
          {hostsError && (
            <Alert severity="error">
              <AlertTitle>
                Warning: Invalid fields detected. Please correct the following fields
                before attempting to upload Hosts CSV.
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
              <Button style={{ marginTop: 8 }} onClick={submitCSV} variant="outlined">
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  `Add ${hosts.length} Host${hosts.length === 1 ? "" : "s"}`
                )}
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}
