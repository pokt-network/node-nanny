import { useState } from "react";
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
  const [submit, { data, error, loading }] = useLogsLazyQuery();

  const [nodes, setNodes] = useState<string[]>([]);

  const handleNodesChange = ({ target }: SelectChangeEvent<typeof nodes>) => {
    const { value } = target;
    setNodes(typeof value === "string" ? value.split(",") : value);
  };

  if (nodesLoading) return <>Loading...</>;
  if (nodesError) return <>Error! ${nodesError.message}</>;

  return (
    //TEST
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
      {/* {data && <Table type="Chains" searchable paginate rows={data.chains} />} */}
    </div>
  );
}
