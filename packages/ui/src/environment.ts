type IStringVars =
  | 'BACKEND_HOST'
  | 'MONITOR_LOGGER'
  | 'DATADOG_URL'
  | 'DATADOG_IFRAME_URL';
type INumberVars = 'BACKEND_PORT';
type IBooleanVars = 'HTTPS' | 'PNF';

type IEnvVars = IStringVars | INumberVars | IBooleanVars;

const ENV_VARS: { [variable: string]: () => string | number | boolean } = {
  BACKEND_HOST: () => process.env.REACT_APP_BACKEND_HOST,
  MONITOR_LOGGER: () => process.env.REACT_APP_MONITOR_LOGGER,
  DATADOG_URL: () => process.env.REACT_APP_DATADOG_URL,
  DATADOG_IFRAME_URL: () => process.env.REACT_APP_DATADOG_IFRAME_URL,

  BACKEND_PORT: () => Number(process.env.BACKEND_PORT || 4000),

  PNF: () => Boolean(process.env.REACT_APP_PNF === '1' || false),
  HTTPS: () => Boolean(process.env.REACT_APP_HTTPS === '1' || false),
};

export const env = <B extends IEnvVars>(
  name: B,
): B extends IStringVars ? string : B extends INumberVars ? number : boolean => {
  return ENV_VARS[name]() as B extends IStringVars
    ? string
    : B extends INumberVars
    ? number
    : boolean;
};

export default env;
