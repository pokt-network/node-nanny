import Paper from "components/Paper";
import Title from "components/Title";
import { ModalHelper } from "utils";

import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";

export interface ConfirmationModalProps {
  handleOk: any;
  promptText: string;
  okText?: string;
  confirmText?: string;
  okColor?: Color;
  cancelColor?: Color;
  error?: string;
}

type Color =
  | "inherit"
  | "success"
  | "error"
  | "primary"
  | "secondary"
  | "info"
  | "warning";

export function ConfirmationModal({
  handleOk,
  promptText,
  okText,
  confirmText,
  okColor,
  cancelColor,
  error,
}: ConfirmationModalProps) {
  return (
    <Paper>
      {confirmText && <Title>{confirmText}</Title>}
      <Typography>
        {promptText.includes("\n")
          ? promptText
              .split("\n")
              .map((line) => <Typography gutterBottom>{line}</Typography>)
          : promptText}
      </Typography>
      <Box
        sx={{
          marginTop: 4,
          textAlign: "right",
          "& button": { margin: 1 },
        }}
      >
        <Button onClick={handleOk} variant="contained" color={okColor || "primary"}>
          {okText || "OK"}
        </Button>
        <Button onClick={() => ModalHelper.close()} color={cancelColor || "inherit"}>
          Cancel
        </Button>
      </Box>
      {error && (
        <Alert severity="error">
          <AlertTitle>{"Error:"}</AlertTitle>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
