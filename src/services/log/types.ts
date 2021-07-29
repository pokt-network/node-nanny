export enum LogGroupPrefix {
  BASE = `/Pocket/NodeMonitoring/`,
}

export interface GroupStreamParams {
  logGroupName: string;
  logStreamName: string;
}

export interface LogEvent {
  message: string;
  timestamp: number;
}

export interface PutLogParams extends GroupStreamParams {
  logEvents: LogEvent[];
  sequenceToken?: string | null;
}
