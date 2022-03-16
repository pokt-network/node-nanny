import { createLogger, format, transports, Logger } from "winston";
import "winston-mongodb";

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
}
