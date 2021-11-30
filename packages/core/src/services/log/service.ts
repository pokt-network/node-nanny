import { createLogger, format, transports, Logger } from "winston";
import "winston-mongodb";

//move types to shared
type Config = {
  logger: LoggerOptions;
  event: EventOptions;
};

enum LoggerOptions {
  MONGODB = "mongodb",
  DATADOG = "datadog",
}
enum EventOptions {
  REDIS = "redis",
  DATADOG = "datadog",
}

export class Service {
  private config: Config;
  constructor(config) {
    this.config = config;
  }

  init({ name, id }: { name: string; id: string }): Logger {
    const transport = {
      mongodb: new transports.MongoDB({
        db: process.env.MONGO_URI_LOGS,
        expireAfterSeconds: 60 * 60 * 24,
        label: id,
      }),
      datadog: new transports.Http({
        host: "http-intake.logs.datadoghq.eu",
        path: `/api/v2/logs?dd-api-key=${process.env.DD_API_KEY}&ddsource=nodejs&service=${name}`,
        ssl: true,
      }),
    }[ this.config.logger];

    return createLogger({
      level: "info",
      exitOnError: false,
      format: format.json(),
      transports: [transport],
    });
  }

  async write({
    name,
    message,
    level,
    id,
  }: {
    name: string;
    message: string;
    level: string;
    id: string;
  }) {
    const logger = this.init({ name, id });
    return await logger.log(level, message);
  }
}
