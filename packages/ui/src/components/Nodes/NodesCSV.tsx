import { Dispatch, useState } from 'react';
import { ApolloQueryResult } from '@apollo/client';
import CSVReader from 'react-csv-reader';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';

import { IGetHostsChainsAndLoadBalancersQuery, INodeCsvInput, INodesQuery } from 'types';
import { ModalHelper, regexTest, s } from 'utils';
import { NodeActionsState } from 'pages/Nodes';

import Paper from 'components/Paper';
import Title from 'components/Title';
import { ConfirmationModalProps } from 'components/modals/CSVConfirmationModal';

interface ICSVNode {
  https: string;
  chain: string;
  host: string;
  port: string;
  automation: string;
  loadBalancers?: string;
  backend?: string;
  server?: string;
  basicAuth?: string;
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
  const [nodesError, setNodesError] = useState<string>('');

  /* ----- Table Options ---- */
  const columnsOrder = [
    'name',
    'chain',
    'host',
    'https',
    'port',
    'automation',
    'backend',
    'loadBalancers',
    'server',
    'basicAuth',
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
      if (!chain) return 'Chain is required';
      if (!validChains?.includes(chain.toUpperCase())) {
        return `${chain} is not a valid chain`;
      }
    },
    host: (host) => {
      if (!host) return 'Host is required';
      if (!validHosts?.includes(host.toLowerCase())) {
        return `${host} is not a valid host`;
      }
    },
    https: (https) => {
      if (https.toLowerCase() !== 'false' && https.toLowerCase() !== 'true') {
        return 'https must be true or false';
      }
    },
    port: (port) => {
      if (!port) return 'Port is required';
      if (!regexTest(port, 'port')) return 'Not a valid port';
    },
    automation: (automation) => {
      if (automation.toLowerCase() !== 'false' && automation.toLowerCase() !== 'true') {
        return 'automation must be true or false';
      }
    },
    backend: (backend, node) => {
      if (node.automation.toLowerCase() === 'true' && !backend) {
        return 'Backend is required if automation is enabled';
      }
    },
    server: (server, node) => {
      if (node.automation.toLowerCase() === 'true' && !server) {
        return 'Server is required if automation is enabled';
      }
    },
    loadBalancers: (loadBalancers, node) => {
      const lbs = splitLoadBalancers(loadBalancers);
      if (node.automation.toLowerCase() === 'true' && !lbs?.length) {
        return 'At least one loadBalancer is required if automation is enabled';
      }
      const invalidLbs = lbs.filter((lb: string) => !validLoadBalancers?.includes(lb));
      if (invalidLbs?.length) {
        return `Invalid load balancer names: ${invalidLbs.join(', ')}`;
      }
    },
    basicAuth: (basicAuth) => {
      if (basicAuth) {
        const [username, password] = basicAuth.split(':');
        if (!basicAuth.includes(':') || !username || !password) {
          return 'Basic Auth must follow the format <USERNAME>:<PASSWORD>';
        }
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
    setNodesError('');
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
        )}: ${missingHeaders.join(', ')}`,
      );
      return;
    }

    const nodesWithRequiredFields = nodesData.filter((node) =>
      requiredFields.every((key) => Object.keys(node).includes(key)),
    );

    const invalidNodes: any = [];
    const counts = {};

    const parsedNodes: INodeCsvInput[] = nodesWithRequiredFields.map((node) => {
      let nodeName = `${node.host}/${node.chain}`;
      counts[nodeName] = counts[nodeName]
        ? counts[nodeName] + 1
        : nodeNames?.filter((name) => name.includes(nodeName))?.length + 1 || 1;
      const count = String(counts[nodeName]).padStart(2, '0');
      nodeName = `${nodeName}/${count}`;

      /* ---- Validate Nodes CSV ---- */
      const invalidFields = validateCsvNodeInput(node, schema);

      if (node.https.toLowerCase() === 'true' && !hostsWithFqdn.includes(node.host)) {
        invalidFields.push(`https: Host does not have an FQDN`);
      }
      if (hostPortCsvCombos.includes(`${node.host}/${node.port}`)) {
        invalidFields.push(`host: Host/port combination is already taken`);
      }

      if (invalidFields.length) {
        invalidNodes.push(`[${nodeName}]: ${invalidFields.join('\n')}`);
      }

      return {
        backend: node.backend,
        port: node.port,
        server: node.server,
        name: nodeName,
        chain: node.chain.toUpperCase(),
        host: node.host.toLowerCase(),
        loadBalancers: splitLoadBalancers(node.loadBalancers),
        https: Boolean(node.https.toLowerCase() === 'true'),
        automation: Boolean(node.automation.toLowerCase() === 'true'),
        basicAuth: node.basicAuth || null,
      };
    });

    const modalProps: ConfirmationModalProps = {
      type: 'Node',
      data: parsedNodes,
      columnsOrder,
      refetch: refetchNodes,
      setState,
    };

    if (invalidNodes.length) {
      modalProps.dataError = invalidNodes.join('\n');
      handleOpenCSVConfirmationModal(modalProps);
    } else {
      handleOpenCSVConfirmationModal(modalProps);
    }
  };

  const splitLoadBalancers = (loadBalancers: string) =>
    loadBalancers
      ?.toLowerCase()
      .split(',')
      .map((lb) => lb.trim())
      .filter(Boolean);

  const handleOpenCSVConfirmationModal = (modalProps: ConfirmationModalProps) => {
    ModalHelper.open({
      modalType: 'csvConfirmation',
      modalProps,
    });
  };

  return (
    <Paper>
      {!hosts?.length && (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          <AlertTitle>No Hosts in Inventory Database</AlertTitle>
          Before creating a node, you must create at least one host using the Hosts
          screen.
        </Alert>
      )}
      <Title>Upload Nodes CSV</Title>
      <Box>
        {!!hosts.length && (
          <>
            <Typography variant="body1" mb={2}>
              Discord alerting channels will be created in the background. Due to
              Discord's rate limiting this can take anywhere from 5 to 20 minutes,
              depending on the number of nodes in the batch.
            </Typography>
            <Typography variant="body1" mb={2}>
              Once this process is complete, the monitor will restart and the nodes in the
              batch will begin being monitored (and automated if applicable).
            </Typography>
            <Alert severity="warning" sx={{ mb: 4 }}>
              Please do not stop the Node Nanny Docker container during this time.
            </Alert>
          </>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <CSVReader
            onFileLoaded={parseNodesCSV}
            parserOptions={{ header: true, skipEmptyLines: true }}
            disabled={!hosts.length}
          />
          <Button
            onClick={() => setState(NodeActionsState.Info)}
            color="error"
            variant="outlined"
          >
            Cancel
          </Button>
        </Box>
      </Box>

      {nodesError && (
        <Alert severity="error">
          <AlertTitle>{`CSV Format Error`}</AlertTitle>
          {nodesError}
        </Alert>
      )}
    </Paper>
  );
};

export default NodesCSV;
