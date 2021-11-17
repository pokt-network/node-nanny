import { createLogger, format, transports, Logger } from "winston";

export class Service {
  init(name: string): Logger {
    return createLogger({
      level: "info",
      exitOnError: false,
      format: format.json(),
      transports: [
        new transports.Http({
          host: "http-intake.logs.datadoghq.eu",
          path: `/api/v2/logs?dd-api-key=${process.env.DD_API_KEY}&ddsource=nodejs&service=${name}`,
          ssl: true,
        }),
      ],
    });
  }

  async write({ name, message, level }: { name: string; message: string; level: string }) {
    const logger = this.init(name);
    return await logger.log(level, message);
  }
}
