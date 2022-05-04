import { useEffect, useMemo, useState } from "react";
import { Alert, AlertTitle, Grid, LinearProgress } from "@mui/material";

import HostCRUD from "components/Hosts/HostCRUD";
import HostsCSV from "components/Hosts/HostsCSV";
import HostLocation from "components/Hosts/HostLocation";

import { Table } from "components";
import {
  IHost,
  useLocationsQuery,
  useHostsQuery,
  useNodesQuery,
  IHostsQuery,
} from "types";
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
    data: nodesData,
    loading: nodesLoading,
    error: nodesError,
    refetch: refetchNodes,
  } = useNodesQuery();
  const {
    data: locationsData,
    error: locationsError,
    loading: locationsLoading,
    refetch: refetchLocations,
  } = useLocationsQuery();

  useEffect(() => {
    refetch();
    refetchNodes();
  }, [refetch, refetchNodes]);

  /* ----- Table Options ---- */
  const filterOptions = {
    filters: ["All", "Load Balancer", "IP", "FQDN"],
    filterFunctions: {
      "Load Balancer": ({ loadBalancer }: IHost) => Boolean(loadBalancer),
      IP: ({ ip }: IHost) => Boolean(ip),
      FQDN: ({ fqdn }: IHost) => Boolean(fqdn),
    },
  };
  const columnsOrder = ["name", "location", "loadBalancer", "nodes"];
  const hostNames = data?.hosts.map(({ name }) => name);

  const hostsWithNode: { [id: string]: number } = useMemo(() => {
    return nodesData?.nodes?.reduce(
      (list: { [id: string]: number }, { host: { id } }) => ({
        ...list,
        [id]: (list[id] || 0) + 1,
      }),
      {},
    );
  }, [nodesData?.nodes]);
  console.log({ hostsWithNode });
  const locationsWithHost: { [id: string]: number } = useMemo(
    () =>
      data?.hosts?.reduce(
        (list: { [id: string]: number }, { location: { id } }) => ({
          ...list,
          [id]: (list[id] || 0) + 1,
        }),
        {},
      ),
    [data?.hosts],
  );

  const handleSelectedHost = (host: IHostsQuery["hosts"][0]) => {
    setState(HostActionsState.Info);
    setSelectedHost(host);
  };

  /* ----- Layout ----- */
  if (loading || nodesLoading || locationsLoading) return <LinearProgress />;
  if (error || nodesError || locationsError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{"Error fetching data: "}</AlertTitle>
          {(error || nodesError || locationsError).message}
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
                hostsWithNode={hostsWithNode}
                setSelectedHost={setSelectedHost}
                type={state}
                locations={locationsData.locations}
                hostNames={hostNames}
                setState={setState}
                refetch={refetch}
              />
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
                locations={locationsData?.locations}
                locationsWithHost={locationsWithHost}
                refetchLocations={refetchLocations}
                setState={setState}
              />
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
              rows={data.hosts.map((host) => ({
                ...host,
                nodes: hostsWithNode[host.id] || null,
              }))}
              mapDisplay={(host: IHost) => ({
                ...host,
                location: host.location.name,
                nodes: hostsWithNode[host.id] || null,
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
