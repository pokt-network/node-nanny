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

import { Table } from "components";
import { useLogsLazyQuery, useNodesQuery } from "types";

export function Logs() {
  const { data: nodesData, error: nodesError, loading: nodesLoading } = useNodesQuery();
  const [submit, { data: logsData, error: logsError, loading: logsLoading }] =
    useLogsLazyQuery();

  const [nodes, setNodes] = useState<string[]>([]);

  useEffect(() => {
    if (nodes.length) {
      submit({
        variables: {
          nodeIds: nodes,
          startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      });
    }
  }, [nodes]);

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
      <div style={{ marginTop: "10px" }} />
      {logsData && (
        <Table
          type={`Showing ${logsData.logs.length} log entries for ${nodes.length} Nodes.`}
          searchable
          paginate
          rows={logsData.logs.map((log) => {
            const { message, timestamp } = log;
            const parsedMessage = JSON.parse(message);
            delete parsedMessage.health;
            return {
              timestamp: new Date(Number(timestamp)).toISOString(),
              ...parsedMessage,
            };
          })}
        />
      )}
    </div>
  );
}
