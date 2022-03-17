import { Schema, model, Model, Types } from "mongoose";

export interface ILog {
  id: Types.ObjectId;
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

export const LogsModel: Model<ILog> = model("logs", logSchema);
