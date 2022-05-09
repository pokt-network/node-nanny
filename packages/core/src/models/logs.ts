import { Schema, model, Document, PaginateModel, PaginateResult } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import env from '../environment';

interface LogDocument extends Document, ILog {}

export type IPaginatedLogs = PaginateResult<ILog>;

export interface ILog {
  timestamp: Date;
  label: string;
  level: string;
  message: string;
}

const logSchema = new Schema<ILog>(
  {
    timestamp: { type: Schema.Types.Date, expiresAt: env('MONGO_MAX_LOG_DAYS') },
    label: String,
    level: String,
    message: String,
  },
  { timestamps: true },
);

logSchema.plugin(mongoosePaginate);

logSchema.index({ timestamp: -1 });
logSchema.index({ label: -1 });

export const LogsModel = model<LogDocument, PaginateModel<LogDocument>>(
  'Logs',
  logSchema,
);
