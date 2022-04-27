type IStringVars =
  | "DD_API_KEY"
  | "DISCORD_SERVER_ID"
  | "DISCORD_TOKEN"
  | "MONGO_URI"
  | "MONITOR_LOGGER"
  | "MONITOR_TEST_DOMAIN"
  | "PAGER_DUTY_API_KEY"
  | "REDIS_HOST";
type INumberVars =
  | "ALERT_RETRIGGER_THRESHOLD"
  | "ALERT_TRIGGER_THRESHOLD"
  | "MONGO_MAX_LOG_NUMBER"
  | "MONGO_MAX_LOG_SIZE"
  | "MONITOR_INTERVAL"
  | "PNF_DISPATCH_THRESHOLD";
type IBooleanVars = "PNF" | "MONITOR_TEST";

type IEnvVars = IStringVars | INumberVars | IBooleanVars;

const ENV_VARS: { [variable: string]: () => string | number | boolean } = {
  DD_API_KEY: () => process.env.DD_API_KEY,
  DISCORD_SERVER_ID: () => process.env.DISCORD_SERVER_ID,
  DISCORD_TOKEN: () => process.env.DISCORD_TOKEN,
  MONGO_URI: () => process.env.MONGO_URI,
  MONITOR_LOGGER: () => process.env.MONITOR_LOGGER,
  MONITOR_TEST_DOMAIN: () => process.env.MONITOR_TEST_DOMAIN,
  PAGER_DUTY_API_KEY: () => process.env.PAGER_DUTY_API_KEY,
  REDIS_HOST: () => process.env.REDIS_HOST,

  ALERT_RETRIGGER_THRESHOLD: () => Number(process.env.ALERT_RETRIGGER_THRESHOLD || 60),
  ALERT_TRIGGER_THRESHOLD: () => Number(process.env.ALERT_TRIGGER_THRESHOLD || 6),
  MONGO_MAX_LOG_NUMBER: () => Number(process.env.MONGO_MAX_LOG_NUMBER || 10000000),
  MONGO_MAX_LOG_SIZE: () => Number(process.env.MONGO_MAX_LOG_SIZE || 5368709120),
  MONITOR_INTERVAL: () => Number(process.env.MONITOR_INTERVAL || 10000),
  PNF_DISPATCH_THRESHOLD: () => Number(process.env.PNF_DISPATCH_THRESHOLD || 5),

  MONITOR_TEST: () => Boolean(process.env.MONITOR_TEST === "1" || false),
  PNF: () => Boolean(process.env.PNF === "1" || false),
};

export default function env<B extends IEnvVars>(
  name: B,
): B extends IStringVars ? string : B extends INumberVars ? number : boolean {
  return ENV_VARS[name]() as B extends IStringVars
    ? string
    : B extends INumberVars
    ? number
    : boolean;
}
