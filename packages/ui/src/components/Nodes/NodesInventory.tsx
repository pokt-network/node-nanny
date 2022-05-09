import { Dispatch } from 'react';

import Paper from 'components/Paper';
import Title from 'components/Title';
import { INode } from 'types';
import { NodeActionsState } from 'pages/Nodes';

import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

interface NodesInventoryProps {
  nodes: INode[];
  setState: Dispatch<NodeActionsState>;
}

export const NodesInventory = ({ nodes, setState }: NodesInventoryProps) => {
  const nodesTotal = nodes.length;
  const healthyTotal = nodes.filter(({ status }) => status === 'OK').length;
  const errorTotal = nodes.filter(({ status }) => status === 'ERROR').length;
  const mutedTotal = nodes.filter(({ muted }) => muted).length;

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
        <Grid item sm={12} md={4} lg={2}>
          <Title>Nodes Inventory</Title>
        </Grid>
        <Grid item sm={12} md>
          <Grid
            container
            spacing={4}
            columns={{ xs: 12, md: 3 }}
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
              <Chip label={nodesTotal} variant="outlined"></Chip>
              <Typography>Nodes</Typography>
            </Grid>
            <Grid item>
              <Chip label={healthyTotal} variant="outlined" color="success"></Chip>
              <Typography color="success.main">Healthy</Typography>
            </Grid>
            <Grid item>
              <Chip label={errorTotal} variant="outlined" color="error"></Chip>
              <Typography color="error">Error</Typography>
            </Grid>
            <Grid item>
              <Chip label={mutedTotal} variant="outlined" color="secondary"></Chip>
              <Typography color="secondary">Muted</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item sm={12} md="auto" sx={{ '& button': { marginLeft: 1 } }}>
          <Button
            onClick={() => setState(NodeActionsState.Create)}
            size="small"
            variant="contained"
          >
            Create Node
          </Button>
          <Button
            onClick={() => setState(NodeActionsState.CreateFrontend)}
            size="small"
            variant="contained"
          >
            Create Frontend
          </Button>
          <Button
            onClick={() => setState(NodeActionsState.Upload)}
            size="small"
            variant="outlined"
          >
            Upload CSV
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NodesInventory;
