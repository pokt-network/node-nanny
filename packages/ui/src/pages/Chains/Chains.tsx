import { Table } from "components";
import { useChainsQuery } from "types";

export function Chains() {
  const { data, error, loading } = useChainsQuery();

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
      {data && <Table type="Chains" searchable paginate rows={data.chains} />}
    </div>
  );
}
