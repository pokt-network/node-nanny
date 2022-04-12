import { Paper, Button, Typography } from "@mui/material";

import { ModalProps } from "./RootModal";
import { ModalHelper } from "utils";

export function ConfirmationModal({ handleOk, promptText }: ModalProps) {
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
