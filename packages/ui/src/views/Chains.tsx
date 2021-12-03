import * as React from "react";
import { Form } from "../components";
interface ViewProps {
  children?: React.ReactNode;
}

export function View(props: ViewProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
     <Form/>
    </div>
  );
}
