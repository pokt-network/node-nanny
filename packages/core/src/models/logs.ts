import { Schema, model, Document, PaginateModel, PaginateResult } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

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
    timestamp: Schema.Types.Date,
    label: String,
    level: String,
    message: String,
  },
  { timestamps: true },
);

logSchema.plugin(mongoosePaginate);

export const LogsModel = model<LogDocument, PaginateModel<LogDocument>>(
  "Logs",
  logSchema,
);
