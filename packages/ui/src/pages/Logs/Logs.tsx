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
import { INode, useLogsQuery, useLogsForChartQuery, useNodesQuery } from "types";
import { ITimePeriod, timePeriods } from "./periods";

import LogsChart from "./LogsChart";

export function Logs() {
  const [nodes, setNodes] = useState<string[]>([]);
  const [logPeriod, setLogPeriod] = useState<ITimePeriod>(timePeriods[0]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { data: nodesData, error: nodesError, loading: nodesLoading } = useNodesQuery();
  // const {
  //   data: logsData,
  //   error: logsError,
  //   fetchMore,
  //   refetch,
  // } = useLogsQuery({
  //   variables: { input: { nodeIds: nodes, page: 1, limit: 100 } },
  //   onCompleted: () => setLogsLoading(false),
  //   onError: () => setLogsLoading(false),
  // });

  // useEffect(() => {
  //   setLogsLoading(true);
  //   refetch();
  // }, [refetch]);

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

  // if (nodesLoading) return <>Loading...</>;
  // if (nodesError || logsError) return <>Error! ${(nodesError || logsError)?.message}</>;

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
      <LogsChart logPeriod={logPeriod} />
      <div style={{ marginTop: "10px" }} />
      {/* {logsData && (
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
      )} */}
    </div>
  );
}
