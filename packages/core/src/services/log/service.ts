import { createLogger, format, Logger, transports } from "winston";
import "winston-mongodb";
import { FilterQuery } from "mongoose";

import { LogsModel, ILog, IPaginatedLogs } from "../../models";
import { INodeLogParams, ILogChartParams, ILogForChart } from "./types";

import env from "../../environment";

export class Service {
  public init(id: string, name: string): Logger {
    const transport = {
      mongodb: new transports.MongoDB({
        db: env("MONGO_URI"),
        label: id,
        collection: "logs",
        leaveConnectionOpen: false,
        capped: true,
        cappedMax: env("MONGO_MAX_LOG_NUMBER"),
        cappedSize: env("MONGO_MAX_LOG_SIZE"),
      }),
      datadog: new transports.Http({
        host: "http-intake.logs.datadoghq.eu",
        path: `/api/v2/logs?dd-api-key=${env(
          "DD_API_KEY",
        )}&ddsource=nodejs&service=node-nanny/${name}`,
        ssl: true,
      }),
    }[env("MONITOR_LOGGER")];

    return createLogger({
      level: "info",
      exitOnError: false,
      format: format.json(),
      transports: [transport],
    });
  }

  /* ----- MongoDB Log Methods ----- */
  public async getLogsForNodes({
    nodeIds,
    startDate,
    endDate,
    page,
    limit,
  }: INodeLogParams): Promise<IPaginatedLogs> {
    const query: FilterQuery<ILog> = { $and: [{ label: { $in: nodeIds } }] };
    if (startDate) query.$and.push({ timestamp: { $gte: new Date(startDate) } });
    if (endDate) query.$and.push({ timestamp: { $lte: new Date(endDate) } });

    return await LogsModel.paginate(query, { page, limit, sort: { timestamp: -1 } });
  }

  public async getLogsForChart({
    startDate,
    endDate,
    increment,
    nodeIds,
  }: ILogChartParams): Promise<ILogForChart[]> {
    const matchQuery: FilterQuery<ILog> = {
      timestamp: { $gte: new Date(startDate), $lt: new Date(endDate) },
    };
    if (nodeIds) matchQuery.label = { $in: nodeIds };
    const logs = await LogsModel.aggregate<{ _id: string; ok: number; error: number }>([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: { $toDate: "$timestamp" } },
                { $mod: [{ $toLong: { $toDate: "$timestamp" } }, increment] },
              ],
            },
          },
          error: { $sum: { $cond: [{ $eq: ["$level", "error"] }, 1, 0] } },
          ok: { $sum: { $cond: [{ $eq: ["$level", "info"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return logs.map((log) => {
      const { _id, ...rest } = log;
      return { ...rest, timestamp: new Date(_id).toISOString() };
    });
  }
}
