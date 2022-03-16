import { Table } from "components";
import { useOraclesQuery } from "types";

export function Oracles() {
  const { data, error, loading } = useOraclesQuery();

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
      {data && <Table type="Oracles" searchable rows={data.oracles} />}
    </div>
  );
}
