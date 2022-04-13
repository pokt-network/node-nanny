import { useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import CSVReader from "react-csv-reader";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import { Table } from "components";
import {
  IGetHostsChainsAndLoadBalancersQuery,
  INodeCsvInput,
  INodesQuery,
  useCreateNodesCsvMutation,
} from "types";
import { ModalHelper, parseBackendError, regexTest, s } from "utils";

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
  const [nodes, setNodes] = useState<INodeCsvInput[]>(undefined);
  const [nodesError, setNodesError] = useState<string>("");
  const [backendError, setBackendError] = useState<string>("");

  /* ----- CSV Validation ----- */
  const validChains = chains.map(({ name }) => name);
  const validHosts = hosts.map(({ name }) => name);
  const hostsWithFqdn = hosts.filter(({ fqdn }) => Boolean(fqdn)).map(({ name }) => name);
  const validLoadBalancers = loadBalancers.map(({ name }) => name);
  const schema = {
    chain: (chain: string) => !!chain && validChains.includes(chain.toUpperCase()),
    host: (host: string) => !!host && validHosts.includes(host.toLowerCase()),
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
    port: (port: string) => regexTest(port, "port"),
    url: (url: string) => regexTest(url, "url"),
  };
  const validate = (node: any, schema: { [key: string]: (value: string) => boolean }) =>
    Object.keys(schema).filter((key) => !schema[key](node[key]));

  /* ----- CSV Parsing ----- */
  const parseNodesCSV = (nodesData: ICSVNode[]) => {
    setBackendError("");
    setNodesError("");
    const requiredFields = Object.keys(schema);
    const nodesMissingRequiredFields = nodesData.filter(
      (node) => !requiredFields.every((key) => Object.keys(node).includes(key)),
    );
    if (nodesMissingRequiredFields?.length) {
      const headers = Object.keys(nodesData[0]);
      const missingHeaders = requiredFields.filter((field) => !headers.includes(field));
      setNodesError(
        `CSV is missing the following required header${s(
          missingHeaders.length,
        )}: ${missingHeaders.join(", ")}`,
      );
      return;
    }

    const nodesWithRequiredFields = nodesData.filter((node) =>
      requiredFields.every((key) => Object.keys(node).includes(key)),
    );

    const invalidNodes: any = [];
    const parsedNodes = nodesWithRequiredFields.map((node) => {
      const invalidFields = validate(node, schema);
      if (node.https.toLowerCase() === "true" && hostsWithFqdn.includes(node.host)) {
        invalidFields.push(
          `[${node.host}/${node.chain}]: Host does not have an FQDN; HTTPS is not allowed without an FQDN.`,
        );
      }
      if (invalidFields.length) {
        invalidNodes.push(
          `Invalid Field${s(invalidFields.length)}: [${node.host}/${
            node.chain
          }]: ${invalidFields.join(", ")}`,
        );
      }
      return {
        ...node,
        https: Boolean(node.https.toLowerCase()),
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

  /* ----- Submit Mutation ----- */
  const [submit, { error, loading }] = useCreateNodesCsvMutation({
    onCompleted: () => {
      refetchNodes();
      ModalHelper.close();
    },
  });

  useEffect(() => {
    if (error) setBackendError(parseBackendError(error));
  }, [error]);

  const submitCSV = () => {
    if (!nodesError && !backendError && nodes) {
      submit({ variables: { nodes } });
    }
  };

  /* ----- Layout ----- */
  return (
    <div>
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Upload Nodes CSV
        </Typography>
        <CSVReader
          onFileLoaded={parseNodesCSV}
          parserOptions={{ header: true, skipEmptyLines: true }}
        />
        {nodesError && (
          <Alert severity="error">
            <AlertTitle>
              Warning: There were one or more issues with your CSV format. Please correct
              the following issues before attempting to create nodes via CSV.
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
              variant="contained"
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
    </div>
  );
}
