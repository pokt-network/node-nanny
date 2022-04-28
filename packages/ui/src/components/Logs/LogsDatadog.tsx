import Paper from "components/Paper";
import Title from "components/Title";

import { Alert, AlertTitle, Box, Button, Grid, Typography } from "@mui/material";

import env from "environment";

export default function LogsDatadog() {
  return (
    <Paper>
      <Grid container spacing={2}>
        <Grid item sm={12} md>
          <Title>PNF Internal</Title>
        </Grid>
        <Grid item sm={12} md="auto" sx={{ "& button": { marginLeft: 1 } }}>
          <Button
            variant="contained"
            href={env("DATADOG_URL")}
            target="_blank"
            size="small"
          >
            View Logs On Datadog
          </Button>
        </Grid>
      </Grid>
      <Alert severity="info">
        <AlertTitle>
          Monitor is in internal mode and logs are being sent to Datadog.
        </AlertTitle>
      </Alert>
      <Box
        component="iframe"
        height="100%"
        width="100%"
        src={`${env("DATADOG_IFRAME_URL")}?theme=dark`}
        sx={{
          mt: 4,
          height: "600px",
          border: "none",
        }}
      />
    </Paper>
  );
}
