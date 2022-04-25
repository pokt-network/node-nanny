import { useState, Dispatch } from "react";

import Paper from "components/Paper"
import Space, { SpaceSizeEnum } from "components/Space"
import LogsChart from "components/Logs/LogsChart"
import { SelectChangeEvent, FormControl, Autocomplete, Checkbox, TextField, InputLabel, Select, MenuItem } from "@mui/material";
import { ITimePeriod, timePeriods } from "utils/periods";
import { INode, INodesQuery } from "types/types";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

type LogsSelectNodesProps = {
  nodes: INodesQuery["nodes"]
  nodeIds: string[]
  setNodeIds: Dispatch<string[]>
}

export const LogsSelectNodes = ({ nodes, nodeIds, setNodeIds }: LogsSelectNodesProps) => {
  const [logPeriod, setLogPeriod] = useState<ITimePeriod>(timePeriods[0]);

  const handleTimePeriodChange = ({ target }: SelectChangeEvent<string>) => {
    const { value } = target;
    setLogPeriod(timePeriods.find(({ code }) => code === value)!);
  };

  const getNodeNameForHealthCheck = ({ host, name }: INode): string => {
    return `${host.name}/${name}`;
  };

  const sortedNodes =
    nodes
      .slice()
      .sort(({ chain: chainA }, { chain: chainB }) =>
        chainA.name.localeCompare(chainB.name),
      ) || [];

  return (
    <Paper>
      <FormControl fullWidth>
        <Autocomplete
          fullWidth
          multiple
          id="nodes-search"
          value={nodeIds.map((nodeId) => sortedNodes.find(({ id }) => id === nodeId))}
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
          onChange={(_event, value: any) => setNodeIds(value.map(({ id }) => id))}
          renderInput={(params) => (
            <TextField {...params} label="Select Nodes" placeholder="Select nodes" />
          )}
        />
      </FormControl>
      <Space h={SpaceSizeEnum.Sm} />
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
      <Space h={SpaceSizeEnum.Sm} />
      <LogsChart logPeriod={logPeriod} nodeIds={nodeIds} />
    </Paper>
  )
}