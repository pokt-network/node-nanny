import { Schema, model, Model } from "mongoose";

enum ErrorStatus {
  ERROR = "ERROR",
  OK = "OK",
  INFO = "INFO",
  WARNING = "WARNING",
}

interface BlockHeight {
  delta: number;
  externalHeight: number;
  internalHeight: number;
}
enum ErrorConditions {
  HEALTHY = "HEALTHY",
  OFFLINE = "OFFLINE",
  NO_RESPONSE = "NO_RESPONSE",
  NOT_SYNCHRONIZED = "NOT_SYNCHRONIZED",
  NO_PEERS = "NO_PEERS",
  PEER_NOT_SYNCHRONIZED = "PEER_NOT_SYNCHRONIZED",
}

export interface ILog {
  nodeId: string;
  createdAt: Date;
  name: string;
  conditions?: ErrorConditions;
  ethSyncing?: any;
  height?: BlockHeight;
  peers?: number;
  status: ErrorStatus;
  health?: any;
  details?: any;
}

const blockHeightSchema = new Schema({
  delta: Number,
  externalHeight: Number,
  internalHeight: Number,
});

export const logSchema = new Schema<ILog>({
  nodeId: Schema.Types.ObjectId,
  createdAt: Date,
  name: String,
  conditions: String,
  ethSyncing: Object,
  height: blockHeightSchema,
  peers: Number,
  status: String,
  health: Object,
  details: Object,
});

/* retention is set to 1 hour, if this is changed the index must be dropped or updated
using collMod
https://docs.mongodb.com/manual/core/index-ttl/#restrictions

*/
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export const LogsModel: Model<ILog> = model("logs", logSchema);
