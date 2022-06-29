import { useCallback } from 'react';

import { Box, Chip, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

import { INode, IGetHealthCheckQuery, IGetServerCountQuery } from 'types';
import {
  formatHeaderCell,
  getSeconds,
  numWithCommas,
  parseSeconds,
  s,
  capitalizeFirstLetter,
} from 'utils';

interface NodeHealthProps {
  node: INode;
  healthCheckData: IGetHealthCheckQuery;
  serverCountData: IGetServerCountQuery;
  loading: boolean;
  haProxyOnline: string | boolean;
}

export const NodeHealth = ({
  node,
  healthCheckData,
  serverCountData,
  loading,
  haProxyOnline,
}: NodeHealthProps) => {
  const getLastChangedDelta = useCallback((healthCheckData: IGetHealthCheckQuery) => {
    const deltaArray = healthCheckData?.healthCheck?.node?.deltaArray;
    if (!deltaArray?.length) return null;

    const latestDelta = deltaArray[deltaArray.length - 1];
    const lastChangedDelta = [...deltaArray]
      .reverse()
      .find((delta) => delta !== latestDelta);
    if (!lastChangedDelta) return null;

    return latestDelta - lastChangedDelta;
  }, []);

  const diff = getLastChangedDelta(healthCheckData);
  const showDeltaDetails =
    diff !== null && healthCheckData.healthCheck.height?.delta > node.chain.allowance;

  return (
    <Box
      sx={{
        width: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'space-between',
        justifyContent: 'center',
        gap: 1,
        p: 2,
        mb: 2,
        borderRadius: 1,
        backgroundColor: 'background.default',
      }}
    >
      <Typography variant="h6" align="center">
        {`Health Check for ${node.name}`}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography>Status</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            sx={{
              height: '10px',
              width: '10px',
            }}
            color={
              ({ OK: 'success', ERROR: 'error' }[node.status] as any) ||
              ('default' as any)
            }
          />
          <Typography>{node.conditions}</Typography>
        </Box>
      </Box>

      {(node.automation || node.frontend) && (
        <>
          {node.automation && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Load Balancer Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  sx={{
                    height: '10px',
                    width: '10px',
                  }}
                  color={loading ? 'default' : haProxyOnline ? 'success' : 'error'}
                />
                <Typography>
                  {loading ? '...' : haProxyOnline ? 'ONLINE' : 'OFFLINE'}
                </Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>{`${node.frontend ? 'Frontend' : 'Backend'} Stats`}</Typography>
            <Typography>
              {loading || !serverCountData
                ? '...'
                : !serverCountData?.serverCount
                ? 'Unable to fetch server count'
                : `${serverCountData.serverCount.online} of ${serverCountData.serverCount.total} Online`}
            </Typography>
          </Box>
        </>
      )}

      {healthCheckData?.healthCheck && (
        <>
          {healthCheckData.healthCheck.height && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Block Height</Typography>
              <Typography>
                {showDeltaDetails
                  ? Object.entries(healthCheckData.healthCheck.height)
                      .filter(
                        ([key]) => key === 'externalHeight' || key === 'internalHeight',
                      )
                      .map(([key, value]) => {
                        const label = {
                          internalHeight: 'Internal',
                          externalHeight: 'External',
                        }[key];
                        return `${label}: ${numWithCommas(value as number)}`;
                      })
                      .join(' / ')
                  : numWithCommas(healthCheckData.healthCheck.height.internalHeight)}
              </Typography>
            </Box>
          )}

          {showDeltaDetails && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Delta</Typography>
              <Typography
                color={diff > 0 ? 'error.main' : diff < 0 ? 'success.main' : 'none'}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {diff > 0 ? (
                  <ArrowUpwardIcon color="error" sx={{ marginLeft: '4px' }} />
                ) : diff < 0 ? (
                  <ArrowDownwardIcon color="success" sx={{ marginLeft: '4px' }} />
                ) : null}
                {`${numWithCommas(healthCheckData.healthCheck.height?.delta)} (${
                  diff > 0 ? '+' : diff < 0 ? '-' : ''
                }${Math.abs(diff)})`}
              </Typography>
            </Box>
          )}

          {healthCheckData.healthCheck.details &&
            Object.entries(healthCheckData.healthCheck.details)
              .filter(
                ([key, value]) =>
                  key !== '__typename' && key !== 'badOracles' && Boolean(value !== null),
              )
              .map(([key, value]) => {
                const displayHeader =
                  key === 'secondsToRecover'
                    ? 'Estimated Time to Sync'
                    : formatHeaderCell(key);

                let displayValue: string;

                if (key === 'secondsToRecover') {
                  if (value === -1) {
                    displayValue = 'Average delta is increasing';
                  } else if (value === 0) {
                    displayValue = 'Delta is stuck';
                  } else {
                    displayValue = `< ${parseSeconds(value as number)}`;
                  }
                } else {
                  displayValue = value.toString();
                }
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{displayHeader}</Typography>
                    <Typography>{displayValue}</Typography>
                  </Box>
                );
              })}

          {healthCheckData.healthCheck.details?.badOracles && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>{`Bad Oracle${s(
                healthCheckData.healthCheck.details.badOracles.length,
              )}`}</Typography>
              <Typography>
                {healthCheckData.healthCheck.details.badOracles.join(', ')}
              </Typography>
            </Box>
          )}

          {healthCheckData.healthCheck.error && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Error Message</Typography>
              <Typography>
                {capitalizeFirstLetter(healthCheckData.healthCheck.error)}
              </Typography>
            </Box>
          )}

          {node.erroredAt && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Error Duration</Typography>
              <Typography>{parseSeconds(getSeconds(node.erroredAt))}</Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default NodeHealth;
