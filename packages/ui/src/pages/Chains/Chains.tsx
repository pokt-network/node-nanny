import { useQuery } from "@apollo/client";

import { GET_ALL_CHAINS } from "queries";
import { Table } from "components";
import ChainsForm from "./ChainsForm";

export function Chains() {
  const { data, error } = useQuery(GET_ALL_CHAINS);

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
        <ChainsForm />
      </div>
      {data && <Table paginate rows={data.chains} />}
    </div>
  );
}
