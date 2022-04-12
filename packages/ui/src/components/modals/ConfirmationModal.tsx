import { Paper, Button, Typography } from "@mui/material";

import { ModalHelper } from "utils";

export interface ConfirmationModalProps {
  handleOk: any;
  promptText: string;
}

export function ConfirmationModal({ handleOk, promptText }: ConfirmationModalProps) {
  return (
    <>
      <Paper style={{ width: "100%", padding: 10 }} variant="outlined">
        <Typography>{promptText}</Typography>
        <div>
          <Button onClick={handleOk} variant="outlined">
            Ok
          </Button>
          <Button onClick={() => ModalHelper.close()} variant="outlined">
            Cancel
          </Button>
        </div>
      </Paper>
    </>
  );
}
