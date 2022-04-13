import { Paper, Button, Typography } from "@mui/material";

import { ModalHelper } from "utils";

export interface ConfirmationModalProps {
  handleOk: any;
  promptText: string;
  okText?: string;
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
}

export function ConfirmationModal({
  handleOk,
  promptText,
  okText,
  okColor,
  cancelColor,
}: ConfirmationModalProps) {
  return (
    <>
      <Paper style={{ width: "100%", padding: 24 }} variant="outlined" color="success">
        <Typography>{promptText}</Typography>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            padding: "0px 16px",
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
      </Paper>
    </>
  );
}
