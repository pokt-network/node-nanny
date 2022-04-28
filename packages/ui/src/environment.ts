type IStringVars =
  | "BACKEND_HOST"
  | "MONITOR_LOGGER"
  | "DATADOG_URL"
  | "DATADOG_IFRAME_URL";
type IBooleanVars = "PNF";

type IEnvVars = IStringVars | IBooleanVars;

const ENV_VARS: { [variable: string]: () => string | boolean } = {
  BACKEND_HOST: () => process.env.REACT_APP_BACKEND_HOST,
  MONITOR_LOGGER: () => process.env.REACT_APP_MONITOR_LOGGER,
  DATADOG_URL: () => process.env.REACT_APP_DATADOG_URL,
  DATADOG_IFRAME_URL: () => process.env.REACT_APP_DATADOG_IFRAME_URL,

  PNF: () => Boolean(process.env.REACT_APP_PNF === "1" || false),
};

export const env = <B extends IEnvVars>(
  name: B,
): B extends IStringVars ? string : boolean => {
  return ENV_VARS[name]() as B extends IStringVars ? string : boolean;
}

export default env