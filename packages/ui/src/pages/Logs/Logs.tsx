import LogsDatadog from "./LogsDatadog";
import LogsMongo from "./LogsMongo";

import Env from "../../environment";

export function Logs() {
  if (
    Env("PNF") &&
    Env("MONITOR_LOGGER") === "datadog" &&
    Env("DATADOG_URL") &&
    Env("DATADOG_IFRAME_URL")
  ) {
    return <LogsDatadog />;
  }

  return <LogsMongo />;
}
