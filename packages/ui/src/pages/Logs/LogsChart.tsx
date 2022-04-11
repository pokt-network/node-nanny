import { memo, useCallback, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";
import { Bar } from "react-chartjs-2";

import { useLogsForChartLazyQuery, ILogsForChartQuery } from "types";
import { ITimePeriod } from "./periods";
import { deepEqual } from "../../utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
};

interface LogsChartProps {
  logPeriod: ITimePeriod;
  nodeIds: string[];
}

function LogsChart({ logPeriod, nodeIds }: LogsChartProps) {
  const { format, increment, numPeriods, timePeriod } = logPeriod;
  const [logData, setLogData] = useState<ILogsForChartQuery["logsForChart"]>([]);

  const getQueryVars = useCallback(() => {
    const endDate = dayjs().toISOString();
    const startDate = dayjs().subtract(numPeriods, timePeriod).toISOString();
    const queryVars: any = { startDate, endDate, increment };
    if (nodeIds?.length) queryVars.nodeIds = nodeIds;
    return queryVars;
  }, [numPeriods, timePeriod, increment, nodeIds]);

  const [submit, { error }] = useLogsForChartLazyQuery({
    onCompleted: ({ logsForChart }) => setLogData(logsForChart),
  });

  useEffect(() => {
    submit({ variables: { input: getQueryVars() } });
  }, [logPeriod, submit, getQueryVars]);

  useEffect(() => {
    const refetchInterval = setInterval(() => {
      submit({ variables: { input: getQueryVars() } });
    }, 15000);
    return () => clearInterval(refetchInterval);
  }, [submit, getQueryVars]);

  const { labels, errors, oks } = logData.reduce(
    (arrays: { labels: string[]; errors: number[]; oks: number[] }, entry) => {
      return {
        labels: [...arrays.labels, dayjs(entry.timestamp).format(format)],
        errors: [...arrays.errors, entry.error],
        oks: [...arrays.oks, entry.ok],
      };
    },
    { labels: [], errors: [], oks: [] },
  ) || { labels: [], errors: [], oks: [] };

  const arbitraryStackKey = "stack";
  const data = {
    labels,
    datasets: [
      {
        stack: arbitraryStackKey,
        data: oks,
        backgroundColor: "rgba(63,203,226,1)",
        hoverBackgroundColor: "rgba(46,185,235,1)",
      },
      {
        stack: arbitraryStackKey,
        data: errors,
        backgroundColor: "rgba(163,103,126,1)",
        hoverBackgroundColor: "rgba(140,85,100,1)",
      },
    ],
  };
  const options: any = {
    animation: {
      duration: 0,
    },
    maintainAspectRatio: false,
  };

  if (error) return <>Error! ${error.message}</>;

  return (
    <div style={{ height: "200px", width: "100%" }}>
      <Bar data={data} options={options} height="200px" width="100"></Bar>
    </div>
  );
}

export default memo(LogsChart, deepEqual);
