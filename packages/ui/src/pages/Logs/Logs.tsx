import LogsDatadog from "./LogsDatadog";
import LogsMongo from "./LogsMongo";

export function Logs() {
  if (
    process.env.REACT_APP_PNF === "1" &&
    process.env.REACT_APP_MONITOR_LOGGER === "datadog" &&
    process.env.REACT_APP_DATADOG_URL &&
    process.env.REACT_APP_DATADOG_IFRAME_URL
  ) {
    return <LogsDatadog />;
  }

  return <LogsMongo />;
}
