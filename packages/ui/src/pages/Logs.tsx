import LogsDatadog from "components/Logs/LogsDatadog";
import LogsMongo from "components/Logs/LogsMongo";

import env from "environment";

export function Logs() {
  if (
    env("PNF") &&
    env("MONITOR_LOGGER") === "datadog" &&
    env("DATADOG_URL") &&
    env("DATADOG_IFRAME_URL")
  ) {
    return <LogsDatadog />;
  }

  return <LogsMongo />;
}
