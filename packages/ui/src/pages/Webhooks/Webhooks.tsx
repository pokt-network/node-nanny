import { Table } from "components";
import { useWebhooksQuery } from "types";

export function Webhooks() {
  const { data, error, loading } = useWebhooksQuery();

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
      {data && <Table type="Webhooks" searchable paginate rows={data.webhooks} />}
    </div>
  );
}
