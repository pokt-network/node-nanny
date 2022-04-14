import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Checkbox,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import { LogTable } from "components";
import { INode, useLogsLazyQuery, useNodesQuery } from "types";
import { s } from "utils";
import { ITimePeriod, timePeriods } from "./periods";

import LogsChart from "./LogsChart";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function LogsMongo() {
  const [nodes, setNodes] = useState<string[]>([]);
  const [logPeriod, setLogPeriod] = useState<ITimePeriod>(timePeriods[0]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { data: nodesData, error: nodesError, loading: nodesLoading } = useNodesQuery();
  const [submit, { data: logsData, error: logsError, fetchMore }] = useLogsLazyQuery({
    variables: { input: { nodeIds: nodes, page: 1, limit: 100 } },
    onCompleted: () => setLogsLoading(false),
    onError: () => setLogsLoading(false),
  });

  const filterOptions = {
    filters: ["All", "Healthy", "Error"],
    filterFunctions: {
      Healthy: ({ status }: INode) => status === "OK",
      Error: ({ status }: INode) => status === "ERROR",
    } as any,
  };
  const columnsOrder = ["name", "status", "conditions", "timestamp"];

  useEffect(() => {
    if (nodes?.length) {
      setLogsLoading(true);
      submit();
    }
  }, [nodes, submit]);

  const handleTimePeriodChange = ({ target }: SelectChangeEvent<string>) => {
    const { value } = target;
    setLogPeriod(timePeriods.find(({ code }) => code === value)!);
  };

  const getNodeNameForHealthCheck = ({ host, name }: INode): string => {
    return `${host.name}/${name}`;
  };

  if (nodesLoading) return <LinearProgress />;
  if (nodesError || logsError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{"Error fetching data: "}</AlertTitle>
          {(nodesError || logsError).message}
        </Alert>
      </>
    );

  const sortedNodes =
    nodesData?.nodes
      ?.slice()
      .sort(({ chain: chainA }, { chain: chainB }) =>
        chainA.name.localeCompare(chainB.name),
      ) || [];

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
      <Autocomplete
        fullWidth
        multiple
        id="nodes-search"
        value={nodes.map((nodeId) => sortedNodes.find(({ id }) => id === nodeId))}
        options={sortedNodes}
        disableCloseOnSelect
        getOptionLabel={(node) => node.name}
        renderOption={(props, node: any, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {getNodeNameForHealthCheck(node)}
          </li>
        )}
        onChange={(_event, value: any) => setNodes(value.map(({ id }) => id))}
        renderInput={(params) => (
          <TextField {...params} label="Select Nodes" placeholder="Select nodes" />
        )}
      />

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
      <LogsChart logPeriod={logPeriod} nodeIds={nodes} />
      <div style={{ marginTop: "10px" }} />
      <LogTable
        type={
          !nodes.length || !logsData
            ? "Select nodes to view logs"
            : `Showing ${logsData?.logs.docs.length} log entries for ${
                nodes.length
              } Node${s(nodes.length)}`
        }
        searchable
        rows={logsData?.logs.docs}
        loading={logsLoading}
        loadItems={() => {
          if (logsData.logs.hasNextPage) {
            setLogsLoading(true);
            fetchMore({
              variables: { page: logsData.logs.docs.length / 100 + 1 },
            });
          }
        }}
        filterOptions={filterOptions}
        columnsOrder={columnsOrder}
      />
    </div>
  );
}
