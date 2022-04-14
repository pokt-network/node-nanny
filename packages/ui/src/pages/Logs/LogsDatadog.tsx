import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";

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
            Monitor is running in internal mode and logs are being sent to Datadog.
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            size="large"
            variant="contained"
            href={process.env.REACT_APP_DATA_DOG_URL}
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
          src="https://p.datadoghq.eu/sb/4636fbae-ec9a-11eb-bd1f-da7ad0900005-253b6d80b93a86a53ce2cb901c66ed54"
        />
      </div>
    </Card>
  );
}
