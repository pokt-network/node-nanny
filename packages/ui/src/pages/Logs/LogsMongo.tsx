import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import { LogsTable } from "./LogsTable";
import { INode, useLogsLazyQuery, useNodesQuery } from "types";
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

  console.log(logsData?.logs);
  const filterOptions = {
    filters: ["All", "OK", "Error"],
    filterFunctions: {
      OK: ({ conditions }) => conditions === "HEALTHY",
      Error: ({ status }) => status === "ERROR",
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
      }}
    >
      <Paper sx={{ width: "100%", padding: 2 }}>
        <FormControl fullWidth>
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
        </FormControl>
        <Box mt={2} />
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
        <Box mt={2} />
        <LogsChart logPeriod={logPeriod} nodeIds={nodes} />
      </Paper>
      <Box mt={4} />
      <LogsTable
        searchable
        rows={logsData?.logs.docs}
        numNodes={nodes?.length}
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
