import { memo, useCallback, useEffect, useState } from "react";
import { Alert, AlertTitle, Box, LinearProgress, Typography } from "@mui/material";
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
import { ITimePeriod } from "utils/periods";
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
  const [logData, setLogData] = useState<ILogsForChartQuery["logsForChart"]>(undefined);

  const getQueryVars = useCallback(() => {
    const endDate = dayjs().toISOString();
    const startDate = dayjs().subtract(numPeriods, timePeriod).toISOString();
    const queryVars: any = { startDate, endDate, increment };
    if (nodeIds?.length) queryVars.nodeIds = nodeIds;
    return queryVars;
  }, [numPeriods, timePeriod, increment, nodeIds]);

  const [submit, { error, loading }] = useLogsForChartLazyQuery({
    onCompleted: ({ logsForChart }) => setLogData(logsForChart),
  });

  useEffect(() => {
    if (nodeIds?.length) submit({ variables: { input: getQueryVars() } });
  }, [logPeriod, submit, getQueryVars, nodeIds]);

  useEffect(() => {
    const refetchInterval = setInterval(() => {
      submit({ variables: { input: getQueryVars() } });
    }, 15000);
    return () => clearInterval(refetchInterval);
  }, [submit, getQueryVars]);

  const { labels, errors, oks } = logData?.reduce(
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
        label: "Healthy",
        stack: arbitraryStackKey,
        data: oks,
        backgroundColor: "#1D8AED",
        hoverBackgroundColor: "#1565ad",
      },
      {
        label: "Error",
        stack: arbitraryStackKey,
        data: errors,
        backgroundColor: "#F93232",
        hoverBackgroundColor: "#b52222",
      },
    ],
  };
  const options: any = { animation: { duration: 0 }, maintainAspectRatio: false };

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>{"Error fetching logs: "}</AlertTitle>
        {error.message}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "200px",
        width: "100%",
        marginBottom: 32,
      }}
    >
      <Typography>
        {!nodeIds?.length
          ? "Select node(s) to view logs"
          : `Logs for ${nodeIds?.length} node${nodeIds?.length}`}
      </Typography>
      {!error && loading && !logData?.length && (
        <div style={{ width: "100%" }}>
          <LinearProgress />
        </div>
      )}
      <Bar data={data} options={options} height="200px" width="100"></Bar>
    </Box>
  );
}

export default memo(LogsChart, deepEqual);
