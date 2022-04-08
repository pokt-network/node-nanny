import { memo, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";
import { Bar } from "react-chartjs-2";

import { useLogsForChartLazyQuery } from "types";
import { ITimePeriod, timePeriods } from "./periods";
import { deepEqual } from "../../utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
};

interface LogsChartProps {
  logPeriod: ITimePeriod;
}

function LogsChart({ logPeriod }: LogsChartProps) {
  const { format, increment, numPeriods, timePeriod } = logPeriod;
  const endDate = useMemo(() => dayjs().toISOString(), []);
  const startDate = useMemo(
    () => dayjs().subtract(numPeriods, timePeriod).toISOString(),
    [numPeriods, timePeriod],
  );

  const [submit, { data: logsData, error, loading }] = useLogsForChartLazyQuery({
    variables: {
      input: { startDate, endDate, increment },
      // input: {
      //   startDate: "2022-04-04T22:15:34.612+00:00",
      //   endDate: "2022-04-08T15:02:52.660+00:00",
      //   increment: 60000,
      // },
    },
  });

  useEffect(() => {
    submit();
  }, [logPeriod, submit]);

  console.log({ logsData });

  // const labels =
  //   logsData?.logsForChart?.map(({ timestamp }) => dayjs(timestamp).format(format)) || [];
  const { labels, errors, oks } = logsData?.logsForChart?.reduce(
    (arrays: { labels: string[]; errors: number[]; oks: number[] }, entry) => {
      return {
        labels: [...arrays.labels, dayjs(entry.timestamp).format(format)],
        errors: [...arrays.errors, entry.error],
        oks: [...arrays.oks, entry.ok],
      };
    },
    { labels: [], errors: [], oks: [] },
  ) || { labels: [], errors: [], oks: [] };

  const options: any = {
    scales: {
      xAxes: [
        {
          stacked: true,
        },
      ],
      yAxes: [
        {
          stacked: true,
        },
      ],
    },
  };

  const arbitraryStackKey = "stack1";
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

  return (
    <div style={{ height: "200px", width: "100%" }}>
      <Bar options={options} data={data} />
    </div>
  );
}

export default memo(LogsChart, deepEqual);
