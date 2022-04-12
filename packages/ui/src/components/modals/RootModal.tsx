import { useReactiveVar } from "@apollo/client";
import { Fade, Modal } from "@mui/material";

import { modalStateVar } from "apollo";
import { ModalHelper } from "utils";

import { ConfirmationModal } from "./ConfirmationModal";

export type ModalTypes = "confirmation";

export interface ModalProps {
  handleOk: any;
  promptText: string;
}

export interface ModalState {
  modalType: ModalTypes;
  modalProps?: ModalProps;
  modalOptions?: {
    onClose?: any;
    disableBackdropClick?: boolean;
  };
}

const MODAL_TYPES: {
  [key: string]: (modalProps: ModalProps) => JSX.Element;
} = {
  confirmation: ConfirmationModal,
};

export function RootModal() {
  const modalState = useReactiveVar(modalStateVar);

  const modalType: ModalTypes = modalState?.modalType;

  const modalProps = modalState.modalProps;

  const { disableBackdropClick, onClose } = modalState?.modalOptions || {};

  if (!modalType) {
    return null;
  }

  const open: boolean = !!modalType;
  const SpecifiedModal = MODAL_TYPES[modalType];
  return (
    <Modal
      aria-labelledby={`${modalType}-modal`}
      open={open}
      onClose={() => {
        if (!disableBackdropClick) {
          ModalHelper.close();
        }
        onClose && onClose();
      }}
      closeAfterTransition
      //   BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "scroll",
      }}
    >
      <Fade in={open}>
        <div style={{ padding: 32 }}>
          <SpecifiedModal {...modalProps} />
        </div>
      </Fade>
    </Modal>
  );
}
