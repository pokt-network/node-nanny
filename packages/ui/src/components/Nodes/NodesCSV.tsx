import { Dispatch, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import CSVReader from "react-csv-reader";
import { Alert, Box, Button, Typography } from "@mui/material";

import { IGetHostsChainsAndLoadBalancersQuery, INodesQuery } from "types";
import { ModalHelper, regexTest, s } from "utils";
import { NodeActionsState } from "pages/Nodes";

import Paper from "components/Paper";
import Title from "components/Title";
import { ConfirmationModalProps } from "components/modals/CSVConfirmationModal";

interface ICSVNode {
  https: string;
  chain: string;
  host: string;
  port: string;
  automation: string;
  loadBalancers?: string;
  backend?: string;
  server?: string;
}

export interface NodesCSVProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCsvCombos: string[];
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
  setState: Dispatch<NodeActionsState>;
}

export const NodesCSV = ({
  formData: { chains, hosts, loadBalancers },
  nodeNames,
  hostPortCsvCombos,
  refetchNodes,
  setState,
}: NodesCSVProps) => {
  const [nodesError, setNodesError] = useState<string>("");

  /* ----- Table Options ---- */
  const columnsOrder = [
    "name",
    "chain",
    "host",
    "https",
    "port",
    "automation",
    "backend",
    "loadBalancers",
    "server",
  ];

  /* ----- CSV Validation ----- */
  const validChains = chains?.map(({ name }) => name);
  const validHosts = hosts?.map(({ name }) => name);
  const hostsWithFqdn = hosts
    ?.filter(({ fqdn }) => Boolean(fqdn))
    .map(({ name }) => name);
  const validLoadBalancers = loadBalancers?.map(({ name }) => name);

  const schema: { [key: string]: (value: string, node?: any) => string } = {
    chain: (chain) => {
      if (!chain) return "Chain is required";
      if (!validChains?.includes(chain.toUpperCase())) {
        return `${chain} is not a valid chain`;
      }
    },
    host: (host) => {
      if (!host) return "Host is required";
      if (!validHosts?.includes(host.toLowerCase())) {
        return `${host} is not a valid host`;
      }
    },
    https: (https) => {
      if (https.toLowerCase() !== "false" && https.toLowerCase() !== "true") {
        return "https must be true or false";
      }
    },
    port: (port) => {
      if (!port) return "Port is required";
      if (!regexTest(port, "port")) return "Not a valid port";
    },
    automation: (automation) => {
      if (automation.toLowerCase() !== "false" && automation.toLowerCase() !== "true") {
        return "automation must be true or false";
      }
    },
    backend: (backend, node) => {
      if (node.automation.toLowerCase() === "true" && !backend) {
        return "Backend is required if automation is enabled";
      }
    },
    server: (server, node) => {
      if (node.automation.toLowerCase() === "true" && !server) {
        return "Server is required if automation is enabled";
      }
    },
    loadBalancers: (loadBalancers, node) => {
      const lbs = splitLoadBalancers(loadBalancers);
      if (node.automation.toLowerCase() === "true" && !lbs?.length) {
        return "At least one loadBalancer is required if automation is enabled";
      }
      const invalidLbs = lbs.filter((lb: string) => !validLoadBalancers?.includes(lb));
      if (invalidLbs?.length) {
        return `Invalid load balancer names: ${invalidLbs.join(", ")}`;
      }
    },
  };

  const validateCsvNodeInput = (
    node: any,
    schema: { [key: string]: (value: string, node?: any) => string },
  ) =>
    Object.keys(schema)
      .filter((key) => !!schema[key](node[key], node))
      .map((key) => `${key}: ${schema[key](node[key], node)}`);

  /* ----- CSV Parsing ----- */
  const parseNodesCSV = (nodesData: ICSVNode[]) => {
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

      /* ---- Validate Nodes CSV ---- */
      const invalidFields = validateCsvNodeInput(node, schema);

      if (node.https.toLowerCase() === "true" && !hostsWithFqdn.includes(node.host)) {
        invalidFields.push(`https: Host does not have an FQDN`);
      }
      if (hostPortCsvCombos.includes(`${node.host}/${node.port}`)) {
        invalidFields.push(`host: Host/port combination is already taken`);
      }

      if (invalidFields.length) {
        invalidNodes.push(`[${nodeName}]: ${invalidFields.join("\n")}`);
      }

      return {
        backend: node.backend,
        port: node.port,
        server: node.server,
        name: nodeName,
        chain: node.chain.toUpperCase(),
        host: node.host.toLowerCase(),
        https: Boolean(node.https.toLowerCase() === "true"),
        automation: Boolean(node.automation.toLowerCase() === "true"),
        loadBalancers: splitLoadBalancers(node.loadBalancers),
      };
    });

    const modalProps: ConfirmationModalProps = {
      type: "Node",
      data: parsedNodes,
      dataError: nodesError,
      columnsOrder,
      refetch: refetchNodes,
      setState,
    };

    if (invalidNodes.length) {
      modalProps.dataError = invalidNodes.join("\n");
      handleOpenCSVConfirmationModal(modalProps);
    } else {
      handleOpenCSVConfirmationModal(modalProps);
    }
  };

  const splitLoadBalancers = (loadBalancers: string) =>
    loadBalancers
      ?.toLowerCase()
      .split(",")
      .map((lb) => lb.trim())
      .filter(Boolean);

  const handleOpenCSVConfirmationModal = (modalProps: ConfirmationModalProps) => {
    ModalHelper.open({
      modalType: "csvConfirmation",
      modalProps,
    });
  };

  return (
    <Paper>
      <Title>Upload Nodes CSV</Title>
      <Box>
        <Typography variant="subtitle1" mb={1}>
          Batch creation of nodes via CSV import can take a long time.
        </Typography>
        <Typography variant="body2" mb={2}>
          This is because Discord channels and webhooks for each chain/location
          combination are created for each node that represents a chain/location that does
          not already exist in the inventory database. Discord imposes rate limiting on
          the automated creation of webhooks so each new channel can take 5-10 seconds to
          create.{" "}
        </Typography>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Please do not navigate away, refresh or close this window during this time.
        </Alert>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <CSVReader
            onFileLoaded={parseNodesCSV}
            parserOptions={{ header: true, skipEmptyLines: true }}
          />
          <Button
            onClick={() => setState(NodeActionsState.Info)}
            variant="outlined"
            color="error"
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default NodesCSV;
