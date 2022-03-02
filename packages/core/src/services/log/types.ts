import { Logger } from "winston";

export interface ILogWriteParams {
  message: string;
  level: string;
  logger: Logger;
}

export interface ILogInitParams {}
