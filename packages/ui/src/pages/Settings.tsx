import * as React from "react";
interface ViewProps {
  children?: React.ReactNode;
}

export function View(props: ViewProps) {
  return <div   style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}>SETTINGS</div>;
}
