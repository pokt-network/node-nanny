export interface INodeLogParams {
  nodeIds: string[];
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}

export interface ILogChartParams {
  startDate: string;
  endDate: string;
  increment: number;
  nodeIds?: string[];
}

export interface ILogForChart {
  timestamp: string;
  ok: number;
  error: number;
}
