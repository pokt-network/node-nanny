import { useReactiveVar } from "@apollo/client";
import { Fade, Modal, Box } from "@mui/material";

import { modalStateVar } from "apollo";

import { ConfirmationModal } from "./ConfirmationModal";

export type IModalTypes = "confirmation" | "hostsForm" | "nodesForm" | "locationsForm";

export interface IModalState {
  modalType: IModalTypes;
  modalProps?: any;
  modalOptions?: {
    onClose?: any;
    disableBackdropClick?: boolean;
  };
}

const MODAL_TYPES = {
  confirmation: ConfirmationModal,
};

export function RootModal() {
  const modalState = useReactiveVar(modalStateVar);

  const modalType: IModalTypes = modalState?.modalType;

  const modalProps = modalState.modalProps;

  const { onClose } = modalState?.modalOptions || {
    onClose: () =>
      modalStateVar({
        modalType: undefined,
        modalProps: undefined,
        modalOptions: undefined,
      }),
  };

  if (!modalType) {
    return null;
  }

  const open: boolean = !!modalType;
  const SpecifiedModal = MODAL_TYPES[modalType];

  return (
    <Modal
      aria-labelledby={`${modalType}-modal`}
      open={open}
      onClose={() => onClose?.()}
      closeAfterTransition
      BackdropProps={{ timeout: 500 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "scroll",
      }}
    >
      <Fade in={open}>
        <Box sx={{ m: 2, width: "100%", maxWidth: "600px" }}>
          <SpecifiedModal {...modalProps} />
        </Box>
      </Fade>
    </Modal>
  );
}
