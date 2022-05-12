import { useState } from 'react';
import { Alert, AlertTitle, Grid, LinearProgress } from '@mui/material';

import { Table } from 'components';
import { IChain, useChainsQuery, useOraclesQuery, IChainsQuery } from 'types';
import { PNFInventory } from 'components/PNF/PNFInventory';
import PNFStatus from 'components/PNF/PNFStatus';

export enum PNFActionsState {
  Info = 'info',
  Create = 'create',
  Edit = 'edit',
  Oracles = 'oracles',
}

export function PNF() {
  const [selectedChain, setSelectedChain] = useState<IChain>(undefined);
  const [state, setState] = useState<PNFActionsState>(PNFActionsState.Info);

  const {
    data: chainsData,
    loading: chainsLoading,
    error: chainsError,
    refetch: refetchChains,
  } = useChainsQuery();
  const {
    data: oraclesData,
    loading: oraclesLoading,
    error: oraclesError,
    refetch: refetchOracles,
  } = useOraclesQuery();

  const columnsOrder = ['name', 'type', 'chainId', 'allowance', 'oracles'];

  const handleSelectedChain = (chain: IChainsQuery['chains'][0]) => {
    if (chain.type !== 'EVM') setState(PNFActionsState.Info);
    setSelectedChain(chain);
  };

  /* ----- Layout ----- */
  if (chainsLoading || oraclesLoading) return <LinearProgress />;
  if (chainsError || oraclesError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{'Error fetching data: '}</AlertTitle>
          {(chainsError || oraclesError).message}
        </Alert>
      </>
    );

  if (chainsData && oraclesData) {
    return (
      <>
        <PNFInventory
          chains={chainsData.chains}
          oracles={oraclesData.oracles}
          setState={setState}
        />
        <Grid container spacing={{ sm: 0, lg: 6 }}>
          {(state === 'info' ||
            state === 'create' ||
            state === 'edit' ||
            state === 'oracles') && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <PNFStatus
                selectedChain={selectedChain}
                type={state}
                setState={setState}
                setSelectedChain={setSelectedChain}
                refetchChains={refetchChains}
                refetchOracles={refetchOracles}
                chains={chainsData?.chains}
                oracles={oraclesData?.oracles}
              />
            </Grid>
          )}
          <Grid item sm={12} lg={6} order={{ lg: 1 }}>
            <Table<IChain>
              type="Chain"
              searchable
              paginate
              columnsOrder={columnsOrder}
              numPerPage={10}
              rows={chainsData?.chains.map((chain) => ({
                ...chain,
                oracles:
                  oraclesData?.oracles.find(
                    ({ chain: chainName }) => chainName === chain.name,
                  )?.urls?.length || null,
              }))}
              selectedRow={selectedChain?.id}
              onSelectRow={handleSelectedChain}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  return <></>;
}
