import { useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import CSVReader from "react-csv-reader";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
} from "@mui/material";

import { Table } from "components";
import {
  IGetHostsChainsAndLoadBalancersQuery,
  INodeCsvInput,
  INodesQuery,
  useCreateNodesCsvMutation,
} from "types";
import { parseBackendError } from "utils";

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

interface NodesCSVProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesCSV({
  formData: { chains, hosts, loadBalancers },
  refetchNodes,
}: NodesCSVProps) {
  const [open, setOpen] = useState(false);
  const [nodes, setNodes] = useState<INodeCsvInput[] | undefined>(undefined);
  const [nodesError, setNodesError] = useState<string>("");
  const [backendError, setBackendError] = useState<string>("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [submit, { error, loading }] = useCreateNodesCsvMutation({
    onCompleted: () => {
      refetchNodes();
      handleClose();
    },
  });

  useEffect(() => {
    if (error) {
      setBackendError(parseBackendError(error));
    }
  }, [error]);

  const submitCSV = () => {
    if (nodes) {
      submit({ variables: { nodes } });
    }
  };

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
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(
        value,
      ),
  };
  const validate = (object: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key](object[key]));

  const parseNodesCSV = (nodesData: ICSVNode[]) => {
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
        port: Number(node.port),
        loadBalancers: node.loadBalancers?.toLowerCase().split(","),
        haProxy: Boolean(node.haProxy),
      };
    });

    if (invalidNodes.length) {
      setNodesError(invalidNodes.join("\n"));
    } else {
      setNodes(parsedNodes);
    }
  };

  return (
    <div>
      <Button onClick={handleOpen} variant="outlined">
        Upload CSV
      </Button>
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
          {nodesError && (
            <Alert severity="error">
              <AlertTitle>
                Warning: Invalid fields detected. Please correct the following fields
                before attempting to upload Nodes CSV.
              </AlertTitle>
              {nodesError}
            </Alert>
          )}
          {backendError && (
            <Alert severity="error">
              <AlertTitle>Backend error: {backendError}</AlertTitle>
            </Alert>
          )}
          {nodes && (
            <>
              <Table
                type={`Adding ${nodes.length} Node${nodes.length === 1 ? "" : "s"}`}
                rows={nodes}
              />
              <Button style={{ marginTop: 8 }} onClick={submitCSV} variant="outlined">
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  `Add ${nodes.length} Node${nodes.length === 1 ? "" : "s"}`
                )}
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}
