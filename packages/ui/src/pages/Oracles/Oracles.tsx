import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_ORACLES } from "queries";
import { IOracle } from "types";
import { OraclesForm } from "./OraclesForm";

export function Oracles() {
  const { data, error } = useQuery<{ oracles: IOracle[] }>(GET_ALL_ORACLES);

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
        <OraclesForm />
      </div>
      {data && <Table paginate rows={data.oracles} />}
    </div>
  );
}
