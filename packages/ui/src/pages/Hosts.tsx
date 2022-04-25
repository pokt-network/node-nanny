import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  LinearProgress,
} from "@mui/material";

import { Table } from "components";
import HostInfo from "components/Hosts/HostInfo";
import HostCRUD from "components/Hosts/HostCRUD";
import { IHost, useLocationsQuery, useHostsQuery, IHostsQuery } from "types";

export type HostsTableRow = IHostsQuery["hosts"][0]

export enum HostActionsState {
  Info = "info",
  Create = "create",
  Edit = "edit",
  Upload = "upload",
  Location = "location"
}

export function Hosts() {
  const [selectedHost, setSelectedHost] = useState<HostsTableRow>(undefined);
  const [state, setState] = useState<HostActionsState>(HostActionsState.Info);
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
  const hostNames = data?.hosts.map(({ name }) => name);
  const locationNames = locationsData?.locations.map(({ name }) => name);


  const handleSelectedHost = (host: IHostsQuery["hosts"][0]) => {
    setState(HostActionsState.Info)
    setSelectedHost(host)
  }

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
        {state === "info" && (
          <HostInfo 
            host={selectedHost} 
            locations={locationsData.locations}
            hostNames={hostNames}
            setState={setState} 
            refetch={refetch}
          ></HostInfo>
        )}
        {(state === "create" || state === "edit") && (
          <HostCRUD 
            host={selectedHost} 
            type={state} 
            locations={locationsData.locations}
            hostNames={hostNames}
            setState={setState} 
            refetch={refetch}
          ></HostCRUD>
        )}
        {/* {state === "upload" && (<HostUpload host={host}></HostUpload>)}
        {state === "location" && (<HostLocation host={host}></HostLocation>)} */}
        <Table<HostsTableRow>
          type="Host"
          searchable
          paginate
          filterOptions={filterOptions}
          columnsOrder={columnsOrder}
          rows={data.hosts}
          mapDisplay={(host) => ({ ...host, location: host.location.name })}
          selectedRow={selectedHost?.id}
          onSelectRow={handleSelectedHost}
        />
      </>
    );
  }

  return <></>;
}
