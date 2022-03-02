import { createLogger, format, transports, Logger } from "winston";
import "winston-mongodb";

import { ILogWriteParams } from "./types";

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
  public init(id: string): Logger {
    const transport = new transports.MongoDB({
      db: process.env.MONGO_URI,
      expireAfterSeconds: 60,
      label: id,
      collection: "logs",
      leaveConnectionOpen: false,
    });

    return createLogger({
      level: "info",
      exitOnError: false,
      format: format.json(),
      transports: [transport],
    });
  }

  public write = async ({ message, level, logger }: ILogWriteParams) => {
    return logger.log(level, message);
  };
}
