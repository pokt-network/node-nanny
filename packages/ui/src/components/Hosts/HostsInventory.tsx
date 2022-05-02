import { Dispatch } from "react";

import Paper from "components/Paper";
import Title from "components/Title";
import { ILocation, IHost } from "types";
import { HostActionsState } from "pages/Hosts";

import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

interface HostsInventoryProps {
  hosts: IHost[];
  locations: ILocation[];
  setState: Dispatch<HostActionsState>;
}

export const HostsInventory = ({ hosts, locations, setState }: HostsInventoryProps) => {
  const hostsTotal = hosts.length;
  const loadBalancerTotal = hosts.filter(({ loadBalancer }) => loadBalancer).length;
  const locationsTotal = locations.length;

  return (
    <Paper>
      <Grid
        container
        spacing={2}
        alignItems="center"
        sx={{
          "& h3": {
            margin: 0,
          },
        }}
      >
        <Grid item sm={12} md={4} lg={2}>
          <Title>Hosts Inventory</Title>
        </Grid>
        <Grid item sm={12} md>
          <Grid
            container
            spacing={4}
            columns={{ xs: 12, md: 4 }}
            sx={{
              "& .MuiGrid-item": {
                display: "flex",
                alignItems: "center",
              },
              "& .MuiTypography-body1": {
                marginLeft: 1,
              },
            }}
          >
            <Grid item>
              <Chip label={hostsTotal} variant="outlined"></Chip>
              <Typography>Hosts</Typography>
            </Grid>
            <Grid item>
              <Chip label={loadBalancerTotal} variant="outlined" color="primary"></Chip>
              <Typography color="primary.main">Load Balancers</Typography>
            </Grid>
            <Grid item>
              <Chip label={locationsTotal} variant="outlined" color="secondary"></Chip>
              <Typography color="secondary">Locations</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item sm={12} md="auto" sx={{ "& button": { marginLeft: 1 } }}>
          <Button
            onClick={() => setState(HostActionsState.Create)}
            size="small"
            variant="contained"
          >
            Create Host
          </Button>
          <Button
            onClick={() => setState(HostActionsState.Upload)}
            size="small"
            variant="outlined"
          >
            Upload CSV
          </Button>
          <Button
            onClick={() => setState(HostActionsState.Location)}
            size="small"
            variant="contained"
          >
            Edit Locations
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default HostsInventory;
