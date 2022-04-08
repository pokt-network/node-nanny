import { useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import { Paper, Button, Modal, Typography } from "@mui/material";

import { INode, INodesQuery, useDeleteNodeMutation } from "types";

interface NodesDeleteProps {
  selectedNode: INode | undefined;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesDelete({ selectedNode, refetchNodes }: NodesDeleteProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [submit] = useDeleteNodeMutation({
    onCompleted: () => {
      handleClose();
      refetchNodes();
    },
  });

  const handleSubmitDeleteNode = () => {
    submit({ variables: { id: selectedNode!.id! } });
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outlined"
        disabled={!selectedNode}
        color="error"
      >
        Delete Node
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div>
          <Paper style={{ width: "100%", padding: 10 }} variant="outlined">
            <Typography>{`Are you sure you wish to delete node ${selectedNode?.name}`}</Typography>
            <Button onClick={handleSubmitDeleteNode} variant="outlined">
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
