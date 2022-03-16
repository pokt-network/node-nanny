import { useState } from "react";
import CSVReader from "react-csv-reader";
import { Alert, AlertTitle, Box, Button, Modal, Typography } from "@mui/material";

import { Table } from "components";
import { INodeCsvInput, IGetHostsChainsAndLoadBalancersQuery } from "types";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

interface ICSVNode {
  chain: string;
  haProxy: string;
  host: string;
  loadBalancers: string;
  port: string;
  url: string;
  backend?: string;
  server?: string;
}
interface ICSVFileInfo {
  name: string;
  size: number;
  type: string;
}

interface NodesCSVProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
}

export function NodesCSV({ formData: { chains, hosts, loadBalancers } }: NodesCSVProps) {
  const [open, setOpen] = useState(false);
  const [nodes, setNodes] = useState<INodeCsvInput[] | undefined>(undefined);
  const [error, setError] = useState<string>("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const validChains = chains.map(({ name }) => name);
  const validHosts = hosts.map(({ name }) => name);
  const validLoadBalancers = loadBalancers.map(({ name }) => name);
  const schema = {
    chain: (value: string) => validChains.includes(value.toUpperCase()),
    host: (value: string) => validHosts.includes(value.toLowerCase()),
    haProxy: (value: string) =>
      value.toLowerCase() === "true" || value.toLowerCase() === "false",
    loadBalancers: (value: string) =>
      value
        .toLowerCase()
        .split(",")
        .every((lb: string) => validLoadBalancers.includes(lb)),
    port: (value: string) =>
      /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(
        value,
      ),
    url: (value: string) =>
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(
        value,
      ),
  };
  const validate = (object: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key](object[key]));

  const parseNodesCSV = (nodesData: ICSVNode[], fileInfo: ICSVFileInfo) => {
    const nodesWithRequiredFields = nodesData.filter((node) =>
      Object.keys(schema).every((key) => Object.keys(node).includes(key)),
    );

    const invalidNodes: any = [];
    const parsedNodes = nodesWithRequiredFields.map((node) => {
      const invalidFields = validate(node, schema);
      if (invalidFields.length) {
        invalidNodes.push(`[${node.host}/${node.chain}]: ${invalidFields.join(", ")}`);
      }
      return {
        ...node,
        chain: node.chain.toUpperCase(),
        host: node.host.toLowerCase(),
        loadBalancers: node.loadBalancers?.toLowerCase().split(","),
        haProxy: Boolean(node.haProxy),
      };
    });

    if (invalidNodes.length) {
      setError(invalidNodes.join("\n"));
    } else {
      setNodes(parsedNodes);
    }
  };

  return (
    <div style={{ cursor: "pointer" }}>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Upload Nodes CSV
          </Typography>
          <CSVReader onFileLoaded={parseNodesCSV} parserOptions={{ header: true }} />
          {error && (
            <Alert severity="error">
              <AlertTitle>
                Warning: Invalid fields detected. Please correct the following fields
                before attempting to upload Nodes CSV.
              </AlertTitle>
              {error}
            </Alert>
          )}
          {nodes && (
            <Table
              type={`Add ${nodes.length} Node${nodes.length === 1 ? "" : "s"}`}
              rows={nodes}
            />
          )}
        </Box>
      </Modal>
    </div>
  );
}
