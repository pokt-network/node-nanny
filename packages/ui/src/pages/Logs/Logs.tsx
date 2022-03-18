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
import { useLogsLazyQuery, useNodesQuery } from "types";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

export function Logs() {
  const [nodes, setNodes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<number>(ONE_MINUTE * 15);

  const { data: nodesData, error: nodesError, loading: nodesLoading } = useNodesQuery();
  const [submit, { data: logsData, error: logsError, loading: logsLoading }] =
    useLogsLazyQuery();

  useEffect(() => {
    if (nodes.length) {
      submit({
        variables: {
          nodeIds: nodes,
          startDate: new Date(Date.now() - startDate).toISOString(),
        },
      });
    }
  }, [nodes, startDate]);

  const handleNodesChange = ({ target }: SelectChangeEvent<typeof nodes>) => {
    const { value } = target;
    console.log({ value });
    setNodes(typeof value === "string" ? value.split(",") : value);
  };

  if (nodesLoading) return <>Loading...</>;
  if (nodesError || logsError) return <>Error! ${(nodesError || logsError)?.message}</>;

  if (logsData) console.log("LOGS DATA HERE!!!", { logsData });

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
              .map((id) => nodesData?.nodes!.find(({ id: node }) => node === id)!.backend)
              .join(", ");
          }}
        >
          {nodesData?.nodes.map(({ port, backend, id, server }) => (
            <MenuItem key={id} value={id}>
              <Checkbox checked={nodes.indexOf(id!) > -1} />
              <ListItemText primary={`${backend}/${port}/${server}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* <div style={{ marginTop: "10px" }} />
      <FormControl fullWidth>
        <InputLabel id="chain-label">Chain</InputLabel>
        <Select
          labelId="chain-label"
          value={chain}
          label="Chain"
          onChange={handleChainChange}
        >
          {formData?.chains.map(({ name, id }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl> */}
      <div style={{ marginTop: "10px" }} />
      {logsData && (
        <LogTable
          type={`Showing ${logsData.logs.length} log entries for ${nodes.length} Nodes.`}
          searchable
          rows={logsData.logs.map((log) => {
            const { message, timestamp } = log;
            const parsedMessage = JSON.parse(message);
            delete parsedMessage.health;
            return {
              timestamp: new Date(Number(timestamp)).toISOString(),
              ...parsedMessage,
            };
          })}
          loading={logsLoading}
          loadItems={() => {
            console.log("UPDATING START DATE", { startDate });
            setStartDate(startDate + ONE_MINUTE * 15);
            console.log("UPDATING START DATE AFTER", { startDate });
            // submit();
          }}
        />
      )}
    </div>
  );
}
