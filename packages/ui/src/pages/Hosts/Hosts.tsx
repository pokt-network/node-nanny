import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_HOSTS } from "queries";
import { IHost } from "types";
import { HostsForm } from "./HostsForm";

export function Hosts() {
  const { data, error, loading } = useQuery<{ hosts: IHost[] }>(GET_ALL_HOSTS);

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
        <HostsForm />
      </div>
      {data && <Table type="Hosts" searchable paginate rows={data.hosts} />}
    </div>
  );
}
