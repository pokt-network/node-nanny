import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";
import { Bar } from "react-chartjs-2";

import { ILogsQuery } from "types";
import { ITimePeriod } from "./Logs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
};

interface LogsChartProps {
  logs: ILogsQuery["logs"]["docs"];
  logPeriod: ITimePeriod;
}

export default function LogsChart({ logs, logPeriod }: LogsChartProps) {
  const timePeriod = Date.now() - (Date.now() - logPeriod.timePeriod);
  const increments = Math.floor(timePeriod / logPeriod.resolution);
  console.log({ increments });
  const labels = [...Array(increments)].map((_, i, a) =>
    dayjs(Date.now() - (a.length - i) * logPeriod.resolution).format(logPeriod.format),
  );

  const data = {
    labels,
    datasets: [
      {
        data: labels.map(() => 1),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <div style={{ height: "200px", width: "100%" }}>
      <Bar options={options} data={data} />
    </div>
  );
}
