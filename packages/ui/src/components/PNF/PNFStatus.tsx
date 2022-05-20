import { Dispatch, useEffect, useState } from 'react';
import { ApolloQueryResult } from '@apollo/client';
import Box from '@mui/material/Box';

import { PNFActionsState } from 'pages/PNF';
import Paper from 'components/Paper';
import Title from 'components/Title';
import ChainsForm from 'components/PNF/ChainsForm';
import OraclesForm from 'components/PNF/OraclesForm';

import { IChain, IChainsQuery, IOracle, IOraclesQuery } from 'types';

interface PNFStatusProps {
  selectedChain: IChain;
  type: PNFActionsState;
  setState: Dispatch<PNFActionsState>;
  setSelectedChain: Dispatch<React.SetStateAction<IChain>>;
  refetchChains: (variables?: any) => Promise<ApolloQueryResult<IChainsQuery>>;
  refetchOracles: (variables?: any) => Promise<ApolloQueryResult<IOraclesQuery>>;
  chains: IChain[];
  oracles: IOracle[];
}

export const PNFStatus = ({
  selectedChain,
  type,
  setState,
  setSelectedChain,
  refetchChains,
  refetchOracles,
  chains,
  oracles,
}: PNFStatusProps) => {
  const [title, setTitle] = useState(`Select Chain To View Status`);
  const [selectedOracle, setSelectedOracle] = useState<IOracle>(undefined);

  useEffect(() => {
    if (type === 'create') {
      setTitle(`Create Chain`);
    }
    if (type === 'edit') {
      setTitle(`Edit Chain`);
    }
    if (type === 'info') {
      setTitle(`Select Chain To View Status`);
    }
    if (type === 'info' && selectedChain) {
      setTitle(`Selected Chain`);
    }
    if (type === 'oracles' && selectedChain) {
      setTitle(
        `Update Oracles for ${selectedChain.name} - Enter one oracle URL per line.`,
      );
    }
  }, [selectedChain, type]);

  useEffect(() => {
    if (selectedChain?.type === 'EVM') {
      const selectedOracle = oracles.find(({ chain }) => chain === selectedChain.name);
      setSelectedOracle(selectedOracle);
    } else {
      setSelectedOracle(undefined);
    }
  }, [selectedChain, oracles]);

  useEffect(() => {
    if (type === PNFActionsState.Create) {
      setSelectedChain(undefined);
    }
  }, [type, setSelectedChain]);

  const chainNames = chains?.map(({ name }) => name);
  const chainIds = chains?.map(({ chainId }) => chainId);

  return (
    <Paper>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          '& h3': { textTransform: 'capitalize' },
        }}
      >
        <Title>{title}</Title>
      </Box>
      <Box>
        {type === PNFActionsState.Oracles ? (
          <OraclesForm
            selectedOracle={selectedOracle}
            refetchOracles={refetchOracles}
            onCancel={() => setState(PNFActionsState.Info)}
            setState={setState}
          />
        ) : (
          <ChainsForm
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            read={type === 'info'}
            update={type === 'info' || type === 'edit'}
            chainNames={chainNames}
            chainIds={chainIds}
            refetchChains={refetchChains}
            refetchOracles={refetchOracles}
            onCancel={() => setState(PNFActionsState.Info)}
            setState={setState}
          />
        )}
      </Box>
    </Paper>
  );
};

export default PNFStatus;
