import { useEffect, useState } from "react";
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { LogTable } from "components";
import { INode, useLogsQuery, useNodesQuery } from "types";

import LogsChart from "./LogsChart";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

export interface ITimePeriod {
  code: string;
  label: string;
  timePeriod: number;
  resolution: number;
  format: string;
}

const timePeriods: ITimePeriod[] = [
  {
    code: "15M",
    label: "Past 15 Minutes",
    timePeriod: ONE_MINUTE * 15,
    resolution: ONE_MINUTE,
    format: "HH:mm",
  },
  {
    code: "1H",
    label: "Past 2 Hours",
    timePeriod: ONE_HOUR,
    resolution: ONE_MINUTE * 5,
    format: "HH:mm",
  },
  {
    code: "4H",
    label: "Past 4 Hours",
    timePeriod: ONE_HOUR * 4,
    resolution: ONE_MINUTE * 15,
    format: "HH:mm",
  },
  {
    code: "1D",
    label: "Past 1 Day",
    timePeriod: ONE_DAY,
    resolution: ONE_HOUR,
    format: "HH:mm",
  },
  {
    code: "2D",
    label: "Past 2 Days",
    timePeriod: ONE_DAY * 2,
    resolution: ONE_HOUR * 3,
    format: "HH:mm",
  },
  {
    code: "3D",
    label: "Past 3 Days",
    timePeriod: ONE_DAY * 3,
    resolution: ONE_HOUR * 6,
    format: "HH:mm",
  },
  {
    code: "7D",
    label: "Past 7 Days",
    timePeriod: ONE_DAY * 7,
    resolution: ONE_HOUR * 12,
    format: "HH:mm",
  },
  {
    code: "15D",
    label: "Past 15 Days",
    timePeriod: ONE_DAY * 15,
    resolution: ONE_DAY,
    format: "ddd MMM DD",
  },
  {
    code: "1MO",
    label: "Past 1 Month",
    timePeriod: ONE_DAY * 30,
    resolution: ONE_DAY * 2,
    format: "ddd, MMM DD",
  },
];

export function Logs() {
  const [nodes, setNodes] = useState<string[]>([]);
  const [logPeriod, setLogPeriod] = useState<ITimePeriod>(timePeriods[0]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { data: nodesData, error: nodesError, loading: nodesLoading } = useNodesQuery();
  const {
    data: logsData,
    error: logsError,
    fetchMore,
    refetch,
  } = useLogsQuery({
    variables: { nodeIds: nodes, page: 1, limit: 100 },
    onCompleted: () => setLogsLoading(false),
    onError: () => setLogsLoading(false),
  });

  useEffect(() => {
    setLogsLoading(true);
    refetch();
  }, [refetch]);

  const handleTimePeriodChange = ({ target }: SelectChangeEvent<string>) => {
    const { value } = target;
    setLogPeriod(timePeriods.find(({ code }) => code === value)!);
  };

  const handleNodesChange = ({ target }: SelectChangeEvent<typeof nodes>) => {
    const { value } = target;
    console.log({ value });
    setNodes(typeof value === "string" ? value.split(",") : value);
  };

  const getNodeNameForHealthCheck = ({ host, name }: INode): string => {
    return `${host.name}/${name}`;
  };

  if (nodesLoading) return <>Loading...</>;
  if (nodesError || logsError) return <>Error! ${(nodesError || logsError)?.message}</>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        margin: "16px",
      }}
    >
      <FormControl fullWidth>
        <InputLabel id="lb-label">Select Nodes</InputLabel>
        <Select
          multiple
          labelId="lb-label"
          value={nodes}
          onChange={handleNodesChange}
          input={<OutlinedInput label="Nodes" />}
          renderValue={(selected) => {
            return selected
              .map((id) => nodesData?.nodes!.find(({ id: node }) => node === id)!.name)
              .join(", ");
          }}
        >
          {nodesData?.nodes.map((node) => (
            <MenuItem key={node.id} value={node.id}>
              <Checkbox checked={nodes.indexOf(node.id!) > -1} />
              <ListItemText primary={getNodeNameForHealthCheck(node as INode)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div style={{ marginTop: "10px" }} />
      <FormControl fullWidth>
        <InputLabel id="chain-label">Time Period</InputLabel>
        <Select
          labelId="chain-label"
          value={logPeriod.code}
          label="Time Period"
          onChange={handleTimePeriodChange}
        >
          {timePeriods.map(({ code, label }) => (
            <MenuItem key={code} value={code}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div style={{ marginTop: "10px" }} />
      {logsData && <LogsChart logs={logsData.logs.docs} logPeriod={logPeriod} />}
      <div style={{ marginTop: "10px" }} />
      {logsData && (
        <LogTable
          type={`Showing ${logsData.logs.docs.length} log entries for ${nodes.length} Nodes.`}
          searchable
          rows={logsData.logs.docs}
          loading={logsLoading}
          loadItems={() => {
            if (logsData.logs.hasNextPage) {
              setLogsLoading(true);
              fetchMore({
                variables: { page: logsData.logs.docs.length / 100 + 1 },
              });
            }
          }}
        />
      )}
    </div>
  );
}
