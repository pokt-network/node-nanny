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
  loadBalancers: string;
  port: string;
  backend?: string;
  frontend?: string;
  server?: string;
}

interface NodesCSVProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCsvCombos: string[];
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesCSV({
  formData: { chains, hosts, loadBalancers },
  nodeNames,
  hostPortCsvCombos,
  refetchNodes,
}: NodesCSVProps) {
  const [nodes, setNodes] = useState<INodeCsvInput[]>(undefined);
  const [nodesError, setNodesError] = useState<string>("");
  const [backendError, setBackendError] = useState<string>("");

  /* ----- Table Options ---- */
  const columnsOrder = [
    "name",
    "chain",
    "host",
    "https",
    "port",
    "haProxy",
    "backend",
    "loadBalancers",
    "server",
    "frontend",
  ];

  /* ----- CSV Validation ----- */
  const validChains = chains?.map(({ name }) => name);
  const validHosts = hosts?.map(({ name }) => name);
  const hostsWithFqdn = hosts
    ?.filter(({ fqdn }) => Boolean(fqdn))
    .map(({ name }) => name);
  const validLoadBalancers = loadBalancers?.map(({ name }) => name);
  const schema = {
    chain: (chain: string) => !!chain && validChains?.includes(chain.toUpperCase()),
    host: (host: string) => !!host && validHosts?.includes(host.toLowerCase()),
    https: (https: string) =>
      https.toLowerCase() === "false" || https.toLowerCase() === "true",
    haProxy: (haProxy: string) =>
      haProxy.toLowerCase() === "true" || haProxy.toLowerCase() === "false",
    loadBalancers: (loadBalancers: string) =>
      !loadBalancers?.length ||
      loadBalancers
        .toLowerCase()
        .split(",")
        .map((lb) => lb.trim())
        .every((lb: string) => validLoadBalancers?.includes(lb)),
    port: (port: string) => regexTest(port, "port"),
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
    const counts = {};
    const parsedNodes = nodesWithRequiredFields.map((node) => {
      let nodeName = `${node.host}/${node.chain}`;
      counts[nodeName] = counts[nodeName]
        ? counts[nodeName] + 1
        : nodeNames?.filter((name) => name.includes(nodeName))?.length + 1 || 1;
      const count = String(counts[nodeName]).padStart(2, "0");
      nodeName = `${nodeName}/${count}`;

      const invalidFields = validate(node, schema);
      if (node.https.toLowerCase() === "true" && !hostsWithFqdn.includes(node.host)) {
        invalidFields.push(
          `[${nodeName}]: Host does not have an FQDN; HTTPS is not allowed without an FQDN.`,
        );
      }
      if (invalidFields.length) {
        invalidNodes.push(
          `Invalid Field${s(invalidFields.length)}: [${nodeName}]: ${invalidFields.join(
            "\n",
          )}`,
        );
      }
      if (nodeNames.includes(nodeName)) {
        invalidNodes.push(`[${nodeName}]: Node name is already taken.`);
      }
      if (hostPortCsvCombos.includes(`${node.host}/${node.port}`)) {
        invalidNodes.push(`[${nodeName}]: Host/port combination is already taken.`);
      }
      if (node.backend && node.frontend) {
        invalidNodes.push(
          `[${nodeName}]: Node may only have backend or frontend, not both.`,
        );
      }
      return {
        ...node,
        https: Boolean(node.https.toLowerCase() === "true"),
        chain: node.chain.toUpperCase(),
        host: node.host.toLowerCase(),
        name: nodeName,
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

  const getNodeName = (chain: string, host: string) => {
    let nodeName = `${chain}/${host}`;
    // const count = String(
    //   (nodeNames?.filter((name) => name.includes(nodeName))?.length || 0) + 1,
    // ).padStart(2, "0");
    return `${nodeName}`;
  };

  /* ----- Layout ----- */
  return (
    <div>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Upload Nodes CSV
        </Typography>
        <Typography gutterBottom>
          Note: Batch creation of nodes via CSV import can take a long time. This is
          because Discord channels and webhooks for each chain/location combination are
          created for each node that represents a chain/location that does not already
          exist in the inventory database. Discord imposes rate limiting on the automated
          creation of webhooks so each new channel can take 5-10 seconds to create.{" "}
        </Typography>
        <Typography gutterBottom>
          Please do not navigate away, refresh or close this window during this time.
        </Typography>
        <CSVReader
          onFileLoaded={parseNodesCSV}
          parserOptions={{ header: true, skipEmptyLines: true }}
        />
        {nodesError && (
          <Alert severity="error" style={{ overflow: "scroll", maxHeight: 200 }}>
            <AlertTitle>
              Warning: There were one or more issues with your CSV format. Please correct
              the following issues before attempting to create nodes via CSV.
            </AlertTitle>
            {nodesError.includes("\n") ? (
              nodesError.split("\n").map((error) => <Typography>{error}</Typography>)
            ) : (
              <Typography>{nodesError}</Typography>
            )}
          </Alert>
        )}
        {backendError && (
          <Alert severity="error">
            <AlertTitle>Backend error: {backendError}</AlertTitle>
          </Alert>
        )}
        {nodes && (
          <div>
            <Table
              type={`Adding ${nodes.length} Node${nodes.length === 1 ? "" : "s"}`}
              rows={nodes}
              columnsOrder={columnsOrder}
              height={400}
            />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <Button
            onClick={ModalHelper.close}
            style={{ height: 40, width: 150 }}
            variant="contained"
            color="error"
          >
            Cancel
          </Button>
          <Button
            disabled={Boolean(!nodes || nodesError || backendError)}
            style={{ marginTop: 8, height: 40, width: 150 }}
            onClick={submitCSV}
            variant="contained"
            color="success"
          >
            {loading ? (
              <CircularProgress size={20} style={{ color: "white" }} />
            ) : !nodes?.length ? (
              "No nodes"
            ) : (
              `Add ${nodes.length} Node${s(nodes.length)}`
            )}
          </Button>
        </div>
      </Box>
    </div>
  );
}
