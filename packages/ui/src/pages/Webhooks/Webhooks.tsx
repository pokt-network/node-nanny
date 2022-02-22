import { useQuery } from "@apollo/client";

import { Table } from "components";
import { GET_ALL_WEBHOOKS } from "queries";
import { Webhook } from "types";
import { WebhooksForm } from "./WebhooksForm";

export function Webhooks() {
  const { data, error } = useQuery<{ webhooks: Webhook[] }>(GET_ALL_WEBHOOKS);

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
        <WebhooksForm />
      </div>
      {data && <Table paginate rows={data.webhooks} />}
    </div>
  );
}
