import { useState } from "react";

import { Table } from "components";
import { IHost, useLocationsQuery, useHostsQuery } from "types";

import { HostsCSV } from "./HostsCSV";
import { HostsForm } from "./HostsForm";
import { HostsUpdate } from "./HostsUpdate";
import { HostsDelete } from "./HostsDelete";

export function Hosts() {
  const [selectedHost, setSelectedHost] = useState<IHost | undefined>(undefined);

  const { data, error, loading, refetch } = useHostsQuery();
  const {
    data: locationsData,
    error: locationsError,
    loading: locationsLoading,
  } = useLocationsQuery();

  if (loading || locationsLoading) return <>Loading...</>;
  if (error || locationsError) return <>Error! ${(error || locationsError)?.message}</>;

  if (data && locationsData) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          margin: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            width: "60%",
            marginBottom: "16px",
          }}
        >
          <HostsForm refetchHosts={refetch} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <HostsCSV locationsData={locationsData} refetchHosts={refetch} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <HostsUpdate selectedHost={selectedHost} refetchHosts={refetch} />
              <HostsDelete selectedHost={selectedHost} refetchHosts={refetch} />
            </div>
          </div>
        </div>
        <Table
          type="Hosts"
          searchable
          paginate
          rows={data.hosts.map((host) => ({ ...host, location: host.location.name }))}
          onSelectRow={setSelectedHost}
        />
      </div>
    );
  }

  return <></>;
}
