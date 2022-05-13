import { Dispatch, useState } from 'react';
import { ApolloQueryResult } from '@apollo/client';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Typography,
} from '@mui/material';

import Paper from 'components/Paper';
import Table from 'components/Table';
import Title from 'components/Title';
import { HostActionsState } from 'pages/Hosts';
import { NodeActionsState } from 'pages/Nodes';

import {
  IHostCsvInput,
  INodeCsvInput,
  useCreateHostsCsvMutation,
  useCreateNodesCsvMutation,
} from 'types';
import { ModalHelper, parseBackendError, s } from 'utils';

export interface ConfirmationModalProps {
  data: (IHostCsvInput | INodeCsvInput)[];
  type: 'Node' | 'Host';
  columnsOrder: string[];
  refetch: (variables?: any) => Promise<ApolloQueryResult<any>>;
  setState: Dispatch<any>;
  dataError?: string;
}

export function CSVConfirmationModal({
  type,
  data,
  dataError,
  columnsOrder,
  refetch,
  setState,
}: ConfirmationModalProps) {
  const [backendError, setBackendError] = useState<string>('');

  /* ----- Submit Nodes Mutation ----- */
  const [submitNodes, { loading: nodesLoading, error: nodesError }] =
    useCreateNodesCsvMutation({
      onCompleted: () => {
        refetch();
        ModalHelper.close();
        setState(NodeActionsState.Info);
      },
      onError: (error) => {
        setBackendError(parseBackendError(error));
      },
    });

  /* ----- SubmitHosts Mutation ----- */
  const [submitHosts, { loading: hostsLoading, error: hostsError }] =
    useCreateHostsCsvMutation({
      onCompleted: () => {
        refetch();
        ModalHelper.close();
        setState(HostActionsState.Info);
      },
      onError: (error) => {
        setBackendError(parseBackendError(error));
      },
    });

  const submitCSV = () => {
    setBackendError('');

    if (!dataError) {
      const dataWithoutId = data.map((item: any) => {
        const { id, ...rest } = item;
        return rest;
      });
      const submitFunction = {
        Node: () => submitNodes({ variables: { nodes: dataWithoutId } }),
        Host: () => submitHosts({ variables: { hosts: dataWithoutId } }),
      }[type];

      submitFunction();
    }
  };

  return (
    <Paper>
      <Title>{`Create ${type}s by CSV Import`}</Title>
      {dataError ? (
        <Alert severity="error" style={{ overflowY: 'scroll', maxHeight: 200 }}>
          <AlertTitle>
            {`Warning: There were one or more issues with your CSV format. Please correct
            the following issues before attempting to create ${type.toLowerCase()}s via CSV.`}
          </AlertTitle>
          {dataError.includes('\n') ? (
            dataError.split('\n').map((error) => <Typography>{error}</Typography>)
          ) : (
            <Typography>{dataError}</Typography>
          )}
        </Alert>
      ) : type === 'Node' ? (
        <>
          <Typography variant="body1" mb={2}>
            Discord alerting channels will be created in the background. Due to Discord's
            rate limiting this can take anywhere from 5 to 20 minutes, depending on the
            number of nodes in the batch.
          </Typography>
          <Typography variant="body1" mb={2}>
            Once this process is complete, the monitor will restart and the nodes in the
            batch will begin being monitored and automated (if applicable).
          </Typography>
          <Alert severity="warning" sx={{ mb: 4 }}>
            Please do not stop the Node Nanny application during this time.
          </Alert>
        </>
      ) : (
        <></>
      )}

      {backendError && (
        <Alert severity="error">
          <AlertTitle>Backend error: {backendError}</AlertTitle>
        </Alert>
      )}
      {(nodesLoading || hostsLoading) && !nodesError && !hostsError && (
        <div style={{ width: '100%' }}>
          <LinearProgress />
        </div>
      )}
      <Table
        type={type}
        rows={data || []}
        columnsOrder={columnsOrder}
        height={'40vh'}
        searchable
      />
      <Box
        sx={{
          marginTop: 4,
          textAlign: 'right',
          '& button': { margin: 1 },
        }}
      >
        <Button
          type="submit"
          variant="contained"
          onClick={submitCSV as any}
          disabled={!!dataError}
          sx={{ width: 160, height: 36.5 }}
        >
          {nodesLoading || hostsLoading ? (
            <CircularProgress size={20} color={'secondary'} />
          ) : (
            `Create ${data.length} ${type}${s(data.length)}`
          )}
        </Button>
        <Button onClick={() => ModalHelper.close()} color="error" variant="outlined">
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}
