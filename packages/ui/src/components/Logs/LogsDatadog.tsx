import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";

import env from "environment";

export default function LogsDatadog() {
  return (
    <Card sx={{ display: "flex", width: "85vw", height: 415, margin: "32px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: 500,
          padding: "16px",
        }}
      >
        <CardMedia
          component="img"
          width="100%"
          image="https://assets.website-files.com/609e7a6f2ec5c05d866ed6d3/60a7cd2bbdce89ccfbf8ff97_POKT_Logo_S_Color.png"
          alt="pokt-logo"
        />
        <CardContent>
          <Typography gutterBottom variant="h3" component="div">
            PNF Internal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor is in internal mode and logs are being sent to Datadog.
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            size="large"
            variant="contained"
            href={env("DATADOG_URL")}
            target="_blank"
          >
            View Logs On Datadog
          </Button>
        </CardActions>
      </div>
      <div style={{ padding: 16, width: "100%" }}>
        <CardMedia
          component="iframe"
          height="100%"
          width="100%"
          src={env("DATADOG_IFRAME_URL")}
        />
      </div>
    </Card>
  );
}
