import { Table } from "components";
import { useLocationsQuery, useHostsQuery } from "types";

import { HostsCSV } from "./HostsCSV";
import { HostsForm } from "./HostsForm";

export function Hosts() {
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
            width: "60%",
            marginBottom: "16px",
          }}
        >
          <HostsForm refetchHosts={refetch} />
          <HostsCSV locationsData={locationsData} refetchHosts={refetch} />
        </div>
        <Table type="Hosts" searchable paginate rows={data.hosts} />
      </div>
    );
  }

  return <></>;
}
