import { useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import { Paper, Button, Modal, Typography } from "@mui/material";

import { IHost, IHostsQuery, useDeleteHostMutation } from "types";

interface HostsDeleteProps {
  selectedHost: IHost | undefined;
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
}

export function HostsDelete({ selectedHost, refetchHosts }: HostsDeleteProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [submit] = useDeleteHostMutation({
    onCompleted: () => {
      handleClose();
      refetchHosts();
    },
  });

  const handleSubmitDeleteHost = () => {
    submit({ variables: { id: selectedHost!.id! } });
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outlined"
        disabled={!selectedHost}
        color="error"
      >
        Delete Host
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div>
          <Paper style={{ width: "100%", padding: 10 }} variant="outlined">
            <Typography>{`Are you sure you wish to delete host ${selectedHost?.name}`}</Typography>
            <Button onClick={handleSubmitDeleteHost} variant="outlined">
              Ok
            </Button>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
          </Paper>
        </div>
      </Modal>
    </>
  );
}
