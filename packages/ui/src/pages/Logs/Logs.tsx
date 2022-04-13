import { LogsMongo } from "./LogsMongo";

export function Logs() {
  if (process.env.REACT_APP_MONITOR_LOGGER === "datadog") {
    return <div>DATADOG LOGS PLACEHOLDER</div>;
  }

  return <LogsMongo />;
}
