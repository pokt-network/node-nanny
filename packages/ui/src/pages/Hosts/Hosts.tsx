import { useQuery } from "@apollo/client";

import { GET_ALL_HOSTS } from "queries";
import { Table } from "components";
import { HostsForm } from "./HostsForm";

export function Hosts() {
  const { data, error } = useQuery(GET_ALL_HOSTS);
  console.log({ error });
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
