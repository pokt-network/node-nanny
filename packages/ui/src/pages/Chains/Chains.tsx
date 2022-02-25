import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_CHAINS } from "queries";
import { IChain } from "types";
import ChainsForm from "./ChainsForm";

export function Chains() {
  const { data, error, loading } = useQuery<{ chains: IChain[] }>(GET_ALL_CHAINS);

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
        <ChainsForm />
      </div>
      {data && <Table type="Chains" searchable paginate rows={data.chains} />}
    </div>
  );
}
