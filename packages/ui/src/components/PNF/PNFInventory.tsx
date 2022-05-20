import { Dispatch } from 'react';
import { Button, Chip, Grid, Typography } from '@mui/material';

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
        <Grid
          direction="row"
          alignItems="center"
          container
          item
          sm={12}
          md="auto"
          sx={{ '& button': { marginRight: 1 } }}
        >
          {' '}
          <Button
            onClick={() => setState(PNFActionsState.Create)}
            size="small"
            variant="contained"
            color="primary"
            sx={{ width: 120 }}
          >
            Create Chain
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PNFInventory;
