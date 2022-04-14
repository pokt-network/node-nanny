import { Alert, AlertTitle, Paper, Button, Typography } from "@mui/material";

import { ModalHelper } from "utils";

export interface ConfirmationModalProps {
  handleOk: any;
  promptText: string;
  okText?: string;
  confirmText?: string;
  okColor?:
    | "inherit"
    | "success"
    | "error"
    | "primary"
    | "secondary"
    | "info"
    | "warning";
  cancelColor?:
    | "inherit"
    | "success"
    | "error"
    | "primary"
    | "secondary"
    | "info"
    | "warning";
  error?: string;
}

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
    <>
      <Paper style={{ width: "100%", padding: 32 }} variant="outlined" color="success">
        {confirmText && (
          <Typography variant="h4" align="center" gutterBottom>
            {confirmText}
          </Typography>
        )}
        <Typography>
          {promptText.includes("\n")
            ? promptText
                .split("\n")
                .map((line) => <Typography gutterBottom>{line}</Typography>)
            : promptText}
        </Typography>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <Button
            onClick={() => ModalHelper.close()}
            variant="contained"
            color={cancelColor || "error"}
          >
            Cancel
          </Button>
          <Button onClick={handleOk} variant="contained" color={okColor || "success"}>
            {okText || "OK"}
          </Button>
        </div>
        {error && (
          <Alert severity="error">
            <AlertTitle>{"Error:"}</AlertTitle>
            {error}
          </Alert>
        )}
      </Paper>
    </>
  );
}
