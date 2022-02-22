import { Schema, model, Model } from "mongoose";

export interface ILog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  label: string;
}

const logSchema = new Schema<ILog>(
  {
    id: Schema.Types.ObjectId,
    label: Schema.Types.ObjectId,
    timestamp: String,
    level: String,
    message: String,
  },
  { timestamps: true },
);

export const LogsModel: Model<ILog> = model("logs", logSchema);
