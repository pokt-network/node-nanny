import { Table } from "components";
import { useHostsQuery } from "types";
import { HostsForm } from "./HostsForm";

export function Hosts() {
  const { data, error, loading, refetch } = useHostsQuery();

  if (loading) return <>Loading...</>;
  if (error) return <>Error! ${error.message}</>;

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
      <div style={{ marginBottom: "16px" }}>
        <HostsForm refetchHosts={refetch} />
      </div>
      {data && <Table type="Hosts" searchable paginate rows={data.hosts} />}
    </div>
  );
}
