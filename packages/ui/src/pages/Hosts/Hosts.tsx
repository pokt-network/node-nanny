import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";

import { Table } from "components";
import { IHost, useLocationsQuery, useHostsQuery } from "types";
import { ModalHelper } from "utils";

import { HostStatus } from "./HostStatus";

export function Hosts() {
  const [selectedHost, setSelectedHost] = useState<IHost>(undefined);
  const { data, error, loading, refetch } = useHostsQuery();
  const {
    data: locationsData,
    error: locationsError,
    loading: locationsLoading,
    refetch: refetchLocations,
  } = useLocationsQuery();

  useEffect(() => {
    refetch();
  }, [refetch]);

  /* ----- Table Options ---- */
  const filterOptions = {
    filters: ["All", "Load Balancer", "IP", "FQDN"],
    filterFunctions: {
      "Load Balancer": ({ loadBalancer }: IHost) => Boolean(loadBalancer),
      IP: ({ ip }: IHost) => Boolean(ip),
      FQDN: ({ fqdn }: IHost) => Boolean(fqdn),
    },
  };
  const columnsOrder = ["name", "location", "ip", "fqdn", "loadBalancer"];

  /* ----- Modal Methods ----- */
  const hostNames = data?.hosts.map(({ name }) => name);
  const locationNames = locationsData?.locations.map(({ name }) => name);

  const handleOpenCreateHostModal = () => {
    ModalHelper.open({
      modalType: "hostsForm",
      modalProps: {
        refetchHosts: refetch,
        locations: locationsData?.locations,
        hostNames,
      },
    });
  };

  const handleOpenUploadNodeCSVModal = () => {
    ModalHelper.open({
      modalType: "hostsCsv",
      modalProps: {
        refetchNodes: refetch,
        locations: locationsData?.locations,
        hostNames,
      },
    });
  };

  const handleOpenAddLocationModal = () => {
    ModalHelper.open({
      modalType: "locationsForm",
      modalProps: { locationNames, refetchLocations },
    });
  };

  /* ----- Layout ----- */
  if (loading || locationsLoading) return <LinearProgress />;
  if (error || locationsError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{"Error fetching data: "}</AlertTitle>
          {(error || locationsError).message}
        </Alert>
      </>
    );

  if (data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Paper
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 500,
              padding: 10,
              marginRight: 16,
              marginBottom: 16,
            }}
            variant="outlined"
          >
            <Typography variant="h4" align="center">
              Hosts Inventory
            </Typography>
            <div style={{ marginLeft: 8 }}>
              <Typography>{data?.hosts.length} Hosts</Typography>
              <Typography>
                {data?.hosts.filter(({ loadBalancer }) => loadBalancer).length} Load
                Balancers
              </Typography>
              <Typography>{locationsData?.locations.length} Locations</Typography>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                width: "100%",
              }}
            >
              <Button
                style={{ marginRight: 8, width: 160 }}
                onClick={handleOpenCreateHostModal}
                variant="contained"
                color="success"
              >
                Create Host
              </Button>
              <Button
                style={{ marginRight: 8, width: 160 }}
                onClick={handleOpenUploadNodeCSVModal}
                variant="contained"
                color="success"
              >
                Upload CSV
              </Button>
              <Button
                style={{ marginRight: 8, width: 160 }}
                onClick={handleOpenAddLocationModal}
                variant="contained"
                color="primary"
              >
                Add Location
              </Button>
            </div>
          </Paper>
          <HostStatus
            selectedHost={selectedHost}
            locations={locationsData?.locations}
            hostNames={hostNames}
            refetchHosts={refetch}
          />
        </div>
        <Table
          type="Host"
          searchable
          paginate
          filterOptions={filterOptions}
          columnsOrder={columnsOrder}
          rows={data.hosts}
          mapDisplay={(host) => ({ ...host, location: host.location.name })}
          selectedRow={selectedHost?.id}
          onSelectRow={setSelectedHost}
        />
      </div>
    );
  }

  return <></>;
}
