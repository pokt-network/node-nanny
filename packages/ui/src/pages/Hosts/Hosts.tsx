import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_HOSTS } from "queries";
import { Host } from "types";
import { HostsForm } from "./HostsForm";

export function Hosts() {
  const { data, error } = useQuery<{ hosts: Host[] }>(GET_ALL_HOSTS);

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
      {data && <Table paginate rows={data.hosts} />}
    </div>
  );
}
