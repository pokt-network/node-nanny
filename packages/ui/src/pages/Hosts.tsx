import { useEffect, useState } from "react";
import { Alert, AlertTitle, Grid, LinearProgress } from "@mui/material";

import HostCRUD from "components/Hosts/HostCRUD";
import HostsCSV from "components/Hosts/HostsCSV";
import HostLocation from "components/Hosts/HostLocation";

import { Table } from "components";
import { IHost, useLocationsQuery, useHostsQuery, IHostsQuery } from "types";
import { HostsInventory } from "components/Hosts/HostsInventory";

export enum HostActionsState {
  Info = "info",
  Create = "create",
  Edit = "edit",
  Upload = "upload",
  Location = "location",
}

export function Hosts() {
  const [selectedHost, setSelectedHost] = useState<IHost>(undefined);
  const [state, setState] = useState<HostActionsState>(HostActionsState.Info);
  const { data, error, loading, refetch } = useHostsQuery({ pollInterval: 1000 * 20 });
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
  const columnsOrder = ["name", "location", "loadBalancer"];
  const hostNames = data?.hosts.map(({ name }) => name);
  const locationNames = locationsData?.locations.map(({ name }) => name);

  const handleSelectedHost = (host: IHostsQuery["hosts"][0]) => {
    setState(HostActionsState.Info);
    setSelectedHost(host);
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
      <>
        <HostsInventory
          hosts={data.hosts}
          locations={locationsData.locations}
          setState={setState}
        />
        <Grid container spacing={{ sm: 0, lg: 4 }}>
          {(state === "info" || state === "create" || state === "edit") && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <HostCRUD
                host={selectedHost}
                type={state}
                locations={locationsData.locations}
                hostNames={hostNames}
                setState={setState}
                refetch={refetch}
              ></HostCRUD>
            </Grid>
          )}
          {state === "upload" && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <HostsCSV
                locations={locationsData?.locations}
                hostNames={hostNames}
                setState={setState}
                refetchHosts={refetch}
              ></HostsCSV>
            </Grid>
          )}
          {state === "location" && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <HostLocation
                locationNames={locationNames}
                refetchLocations={refetchLocations}
                setState={setState}
              ></HostLocation>
            </Grid>
          )}
          <Grid item sm={12} lg={6} order={{ lg: 1 }}>
            <Table<IHost>
              type="Host"
              searchable
              paginate
              filterOptions={filterOptions}
              columnsOrder={columnsOrder}
              numPerPage={10}
              rows={data.hosts}
              mapDisplay={(host: IHost) => ({
                ...host,
                location: host.location.name,
              })}
              selectedRow={selectedHost?.id}
              onSelectRow={handleSelectedHost}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  return <></>;
}
