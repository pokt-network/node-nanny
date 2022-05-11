import { Dispatch } from 'react';
import { Box, Button, Chip, Grid, Typography } from '@mui/material';

import { PNFTypeState, PNFActionsState } from 'pages/PNF';
import Paper from 'components/Paper';
import Title from 'components/Title';
import { IChain, IOracle } from 'types';

interface PNFInventoryProps {
  chains: IChain[];
  oracles: IOracle[];
  typeState: PNFTypeState;
  setState: Dispatch<PNFActionsState>;
  setTypeState: Dispatch<PNFTypeState>;
}

export const PNFInventory = ({
  chains,
  oracles,
  typeState,
  setState,
  setTypeState,
}: PNFInventoryProps) => {
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
              <Chip label={numChains} variant="outlined" color="primary" />
              <Typography color="primary.main">Chains</Typography>
            </Grid>
            <Grid item>
              <Chip label={numChainTypes} variant="outlined" />
              <Typography>Chain Types</Typography>
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
            color={typeState === PNFTypeState.Chains ? 'primary' : 'secondary'}
            sx={{ width: 120 }}
          >
            {`Create ${typeState === PNFTypeState.Chains ? 'Chain' : 'Oracle'}`}
          </Button>
          <Box
            sx={{
              width: 'auto',
              display: 'flex',
              alignItems: 'space-between',
              justifyContent: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              backgroundColor: 'background.default',
            }}
          >
            <Button
              onClick={() => setTypeState(PNFTypeState.Chains)}
              size="small"
              variant={typeState === PNFTypeState.Chains ? 'contained' : 'outlined'}
              color="primary"
              sx={{ width: 120 }}
            >
              View Chains
            </Button>
            <Button
              onClick={() => setTypeState(PNFTypeState.Oracles)}
              size="small"
              variant={typeState === PNFTypeState.Oracles ? 'contained' : 'outlined'}
              color="secondary"
              sx={{ width: 120 }}
            >
              View Oracles
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PNFInventory;
