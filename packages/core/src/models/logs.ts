import { Schema, model, Model, Types } from "mongoose";

export interface ILog {
  id: Types.ObjectId;
  timestamp: string;
  level: string;
  message: string;
  label: string;
}

const logSchema = new Schema<ILog>(
  {
    label: Schema.Types.ObjectId,
    timestamp: String,
    level: String,
    message: String,
  },
  { timestamps: true },
);

export const LogsModel: Model<ILog> = model("logs", logSchema);
