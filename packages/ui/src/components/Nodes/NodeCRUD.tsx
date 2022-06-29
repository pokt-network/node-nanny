import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ApolloQueryResult } from '@apollo/client';
import { Alert, AlertTitle, Box, Button, CircularProgress, Grid } from '@mui/material';

import {
  INode,
  INodesQuery,
  IGetHostsChainsAndLoadBalancersQuery,
  useDisableHaProxyServerMutation,
  useEnableHaProxyServerMutation,
  useGetHealthCheckLazyQuery,
  useGetNodeStatusLazyQuery,
  useGetServerCountLazyQuery,
  useMuteMonitorMutation,
  useUnmuteMonitorMutation,
} from 'types';
import { ModalHelper, SnackbarHelper } from 'utils';
import text from 'utils/monitor-text';

import { NodeActionsState } from 'pages/Nodes';
import Paper from 'components/Paper';
import Title from 'components/Title';

import NodeForm from './NodeForm';
import NodeHealth from './NodeHealth';

interface NodeCRUDProps {
  node: INode;
  type: NodeActionsState;
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  frontendHostChainCombos: string[];
  setSelectedNode: Dispatch<SetStateAction<INode>>;
  refetch: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
  setState: Dispatch<NodeActionsState>;
}

export const NodeCRUD = ({
  node,
  nodeNames,
  type,
  formData,
  hostPortCombos,
  frontendHostChainCombos,
  setSelectedNode,
  setState,
  refetch,
}: NodeCRUDProps) => {
  const [title, setTitle] = useState('Select Node To View Status');

  /* ---- Queries/Mutations ---- */
  const [getStatus, { data, error: getStatusError, loading }] = useGetNodeStatusLazyQuery(
    { variables: { id: node?.id } },
  );
  const [getServerCount, { data: serverCountData }] = useGetServerCountLazyQuery({
    variables: { id: node?.id },
  });

  const [addToRotation] = useEnableHaProxyServerMutation({
    variables: { id: node?.id },
    onCompleted: () => {
      ModalHelper.close();
      SnackbarHelper.open({ text: 'Node successfully added to rotation.' });
      getStatus();
    },
    onError: (error) => ModalHelper.setError(error.message),
  });
  const [removeFromRotation] = useDisableHaProxyServerMutation({
    variables: { id: node?.id },
    onCompleted: () => {
      ModalHelper.close();
      SnackbarHelper.open({ text: 'Node successfully removed from rotation.' });
      getStatus();
    },
    onError: (error) => ModalHelper.setError(error.message),
  });

  const [muteMonitor] = useMuteMonitorMutation({
    variables: { id: node?.id },
    onCompleted: ({ muteMonitor }) => {
      SnackbarHelper.open({ text: `Node ${muteMonitor.name} successfully muted.` });
      const { muted } = muteMonitor;
      setSelectedNode({ ...node, muted });
      ModalHelper.close();
    },
    onError: (error) => ModalHelper.setError(error.message),
  });
  const [unmuteMonitor] = useUnmuteMonitorMutation({
    variables: { id: node?.id },
    onCompleted: ({ unmuteMonitor }) => {
      SnackbarHelper.open({ text: `Node ${muteMonitor.name} successfully unmuted.` });
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...node, muted });
      ModalHelper.close();
    },
    onError: (error) => ModalHelper.setError(error.message),
  });

  /* ---- Node Health Check ---- */
  const [getHealthCheck, { data: healthCheckData, refetch: refetchHealthCheck }] =
    useGetHealthCheckLazyQuery({ variables: { id: node?.id } });

  useEffect(() => {
    let healthCheckInterval: NodeJS.Timer;
    clearInterval(healthCheckInterval);
    if (type === 'info' && node) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = setInterval(refetchHealthCheck, 10000);
    }

    return () => clearInterval(healthCheckInterval);
  }, [node, refetchHealthCheck, type]);

  useEffect(() => {
    if (node?.automation && !node?.frontend) {
      getStatus({ variables: { id: node.id } });
    }
    if (node?.automation || node?.frontend) {
      getServerCount({ variables: { id: node.id } });
    }
    if (node) {
      getHealthCheck();
    }
  }, [node, getStatus, getServerCount, getHealthCheck]);

  useEffect(() => {
    if (type === 'create') {
      setTitle('Create Node');
    }
    if (type === 'createFrontend') {
      setTitle('Create Frontend');
    }
    if (type === 'edit') {
      setTitle('Edit Node');
    }
    if (type === 'info') {
      setTitle('Select Node To View Status');
    }
    if (type === 'info' && node) {
      setTitle(`Selected ${node.frontend ? 'Frontend' : 'Node'}`);
    }
  }, [node, type]);

  const handleHaProxyButtonClick = () => {
    haProxyOnline ? removeFromRotation() : addToRotation();
  };

  const handleMuteToggle = () => (node?.muted ? unmuteMonitor() : muteMonitor());

  const haProxyOnline = { '0': true, '1': false, '-1': 'n/a' }[
    String(data?.haProxyStatus)
  ];
  const haProxyButtonDisabled =
    !node?.automation ||
    loading ||
    !!getStatusError ||
    typeof haProxyOnline !== 'boolean';
  const haProxyButtonText = `${haProxyOnline ? 'Remove from' : 'Add to'} Rotation`;

  /* ---- Height Check Logic ---- */

  /* ---- Modal Functions ---- */
  const handleOpenMuteModal = () => {
    ModalHelper.open({
      modalType: 'confirmation',
      modalProps: {
        handleOk: handleMuteToggle,
        confirmText: `${node?.muted ? 'Unmute' : 'Mute'} Node: ${node?.name}`,
        okText: `${node?.muted ? 'Unmute' : 'Mute'} Node`,
        promptText: (node?.muted ? text.unmuteMonitor : text.muteMonitor).replaceAll(
          '{selectedNode}',
          node.name,
        ),
      },
    });
  };

  const handleOpenRotationModal = () => {
    ModalHelper.open({
      modalType: 'confirmation',
      modalProps: {
        handleOk: handleHaProxyButtonClick,
        confirmText: `${haProxyOnline ? 'Remove From Rotation' : 'Add to Rotation'}: ${
          node?.name
        }`,
        okText: `${haProxyOnline ? 'Remove' : 'Add'} Node`,
        promptText: (haProxyOnline
          ? text.removeFromRotation
          : text.addToRotation
        ).replaceAll('{selectedNode}', node.name),
      },
    });
  };

  return (
    <Paper>
      <Grid container spacing={2}>
        <Grid item sm={12} md>
          <Title>{title}</Title>
        </Grid>
        {node && type !== 'create' && type !== 'createFrontend' && (
          <Grid item sm={12} md="auto" sx={{ '& button': { marginLeft: 1 } }}>
            <Button
              onClick={handleOpenMuteModal}
              disabled={!node}
              color="secondary"
              size="small"
              variant="outlined"
            >
              {node?.muted ? 'Unmute Node' : 'Mute Node'}
            </Button>
            <Button
              onClick={handleOpenRotationModal}
              disabled={haProxyButtonDisabled}
              color="warning"
              size="small"
              variant="outlined"
              sx={{ width: 180 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Checking Status
                </>
              ) : !node?.automation || haProxyOnline === 'n/a' ? (
                'Automation Disabled'
              ) : (
                haProxyButtonText
              )}
            </Button>
          </Grid>
        )}
      </Grid>
      <Box>
        {node && type !== 'create' && type !== 'createFrontend' && type !== 'edit' && (
          <NodeHealth
            node={node}
            loading={loading}
            healthCheckData={healthCheckData}
            serverCountData={serverCountData}
            haProxyOnline={haProxyOnline}
          />
        )}

        <NodeForm
          read={type === 'info'}
          frontend={type === 'createFrontend'}
          update={type === 'info' || type === 'edit'}
          updateFrontend={type === 'edit' && !!node.frontend}
          nodeNames={nodeNames}
          formData={formData}
          hostPortCombos={hostPortCombos}
          frontendHostChainCombos={frontendHostChainCombos}
          refetchNodes={refetch}
          selectedNode={type !== 'create' ? node : null}
          setSelectedNode={setSelectedNode}
          onCancel={() => setState(NodeActionsState.Info)}
          setState={setState}
        />
      </Box>
      {node && type !== 'create' && getStatusError && (
        <Box sx={{ marginTop: 2 }}>
          <Alert severity="error">
            <AlertTitle>{'Error fetching HAProxy status'}</AlertTitle>
            {getStatusError.message}
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default NodeCRUD;
