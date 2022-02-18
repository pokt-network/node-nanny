import * as React from "react";
import { gql, useQuery } from "@apollo/client";
import { ChainsTable, Form } from ".";

interface ViewProps {
  children?: React.ReactNode;
}

export function View(props: ViewProps) {
  const { data, error } = useQuery(
    gql(`query Chains {
      chains {
        id
        name
        type
        chain
      }
    }`),
  );

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
        <Form />
      </div>
      {data && <ChainsTable chains={data.chains} />}
    </div>
  );
}
