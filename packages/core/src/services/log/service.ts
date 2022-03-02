import { createLogger, format, transports, Logger } from "winston";
import "winston-mongodb";
import { ILogWriteParams } from "./types";

export class Service {
  public init(id: string): Logger {
    const transport = new transports.MongoDB({
      db: process.env.MONGO_URI,
      expireAfterSeconds: 60,
      label: id,
      collection: "logs",
      leaveConnectionOpen: false, //DEV NOTE --> Trial setting this as true re: # of connections
    });

    return createLogger({
      level: "info",
      exitOnError: false,
      format: format.json(),
      transports: [transport],
    });
  }

  public write = ({ message, level, logger }: ILogWriteParams): void => {
    logger.log(level, message);
  };
}
