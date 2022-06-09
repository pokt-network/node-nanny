import { Dispatch } from 'react';
import { Chip, Grid, Typography } from '@mui/material';

import { PNFActionsState } from 'pages/PNF';
import Paper from 'components/Paper';
import Title from 'components/Title';
import { IChain, IOracle } from 'types';

interface PNFInventoryProps {
  chains: IChain[];
  oracles: IOracle[];
  setState: Dispatch<PNFActionsState>;
}

export const PNFInventory = ({ chains, oracles, setState }: PNFInventoryProps) => {
  const numChains = chains.length;
  const numChainTypes = chains.reduce(
    (types, chain) => (types.includes(chain.type) ? types : [...types, chain.type]),
    [],
  ).length;
  const numOracles = oracles.length;

  return (
    <Paper>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent={'space-between'}
        sx={{
          '& h3': {
            margin: 0,
          },
        }}
      >
        <Grid item sm={12} md={4} lg={4}>
          <Title>Chains & Oracles Inventory</Title>
        </Grid>
        <Grid item sm={8} md>
          <Grid
            container
            justifyContent="flex-end"
            spacing={4}
            columns={{ xs: 12, md: 4 }}
            sx={{
              '& .MuiGrid-item': {
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiTypography-body1': {
                marginLeft: 1,
              },
              paddingRight: 8,
            }}
          >
            <Grid item>
              <Chip label={numChainTypes} variant="outlined" />
              <Typography>Chain Types</Typography>
            </Grid>
            <Grid item>
              <Chip label={numChains} variant="outlined" color="primary" />
              <Typography color="primary.main">Chains</Typography>
            </Grid>
            <Grid item>
              <Chip label={numOracles} variant="outlined" color="secondary" />
              <Typography color="secondary">Oracles</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PNFInventory;
