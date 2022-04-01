import { createLogger, format, Logger, transports } from "winston";
import "winston-mongodb";

export class Service {
  public init(id: string, name: string): Logger {
    const transport = {
      mongodb: new transports.MongoDB({
        db: process.env.MONGO_URI,
        expireAfterSeconds: 60,
        label: id,
        collection: "logs",
        leaveConnectionOpen: false,
      }),
      datadog: new transports.Http({
        host: "http-intake.logs.datadoghq.eu",
        path: `/api/v2/logs?dd-api-key=${process.env.DD_API_KEY}&ddsource=nodejs&service=node-nanny/${name}`,
        ssl: true,
      }),
    }[process.env.MONITOR_LOGGER];

    return createLogger({
      level: "info",
      exitOnError: false,
      format: format.json(),
      transports: [transport],
    });
  }
}
