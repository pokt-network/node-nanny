import { Table } from "components";
import { useOraclesQuery } from "types";
import { OraclesForm } from "./OraclesForm";

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
      <div style={{ marginBottom: "16px" }}>
        <OraclesForm />
      </div>
      {data && <Table type="Oracles" searchable rows={data.oracles} />}
    </div>
  );
}
