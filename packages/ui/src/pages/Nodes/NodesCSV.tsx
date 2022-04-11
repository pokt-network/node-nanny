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
  https: string;
  chain: string;
  haProxy: string;
  host: string;
  name: string;
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

  console.log({ chains });

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
    if (!nodesError && !backendError && nodes) {
      submit({ variables: { nodes } });
    }
  };

  const validChains = chains.map(({ name }) => name);
  const validHosts = hosts.map(({ name }) => name);
  const hostsWithFqdn = hosts.filter(({ fqdn }) => Boolean(fqdn)).map(({ name }) => name);
  const validLoadBalancers = loadBalancers.map(({ name }) => name);
  const schema = {
    chain: (chain: string) => validChains.includes(chain.toUpperCase()),
    host: (host: string) => validHosts.includes(host.toLowerCase()),
    https: (https: string) =>
      https.toLowerCase() === "false" || https.toLowerCase() === "true",
    name: (name: string) => !!name,
    haProxy: (haProxy: string) =>
      haProxy.toLowerCase() === "true" || haProxy.toLowerCase() === "false",
    loadBalancers: (loadBalancers: string) =>
      loadBalancers
        .toLowerCase()
        .split(",")
        .map((lb) => lb.trim())
        .every((lb: string) => validLoadBalancers.includes(lb)),
    port: (port: string) =>
      /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(
        port,
      ),
    url: (url: string) =>
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(
        url,
      ),
  };
  const validate = (node: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key](node[key]));

  const parseNodesCSV = (nodesData: ICSVNode[]) => {
    setBackendError("");
    setNodesError("");
    const nodesWithRequiredFields = nodesData.filter((node) =>
      Object.keys(schema).every((key) => Object.keys(node).includes(key)),
    );

    const invalidNodes: any = [];
    const parsedNodes = nodesWithRequiredFields.map((node) => {
      const invalidFields = validate(node, schema);
      if (node.https.toLowerCase() === "true" && hostsWithFqdn.includes(node.host)) {
        invalidFields.push(
          "Selected Host does not have an FQDN; HTTPS is not allowed without an FQDN.",
        );
      }
      if (invalidFields.length) {
        invalidNodes.push(`[${node.host}/${node.chain}]: ${invalidFields.join(", ")}`);
      }
      return {
        ...node,
        https: Boolean(node.https),
        chain: node.chain.toUpperCase(),
        host: node.host.toLowerCase(),
        name: node.name,
        port: Number(node.port),
        loadBalancers: node.loadBalancers
          ?.toLowerCase()
          .split(",")
          .map((lb) => lb.trim()),
        haProxy: Boolean(node.haProxy),
      };
    });

    if (invalidNodes.length) {
      setNodesError(invalidNodes.join("\n"));
      setNodes(parsedNodes);
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
              <Button
                disabled={Boolean(!nodes || nodesError || backendError)}
                style={{ marginTop: 8 }}
                onClick={submitCSV}
                variant="outlined"
              >
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
