import { Schema, model, Model } from "mongoose";

export interface ILog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  label: string;
}

const logSchema = new Schema<ILog>({
  id: Schema.Types.ObjectId,
  timestamp: String,
  level: String,
  message: String,
  label: Schema.Types.ObjectId
});

export const LogsModel: Model<ILog> = model("logs", logSchema);
