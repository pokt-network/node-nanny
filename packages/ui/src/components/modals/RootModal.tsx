import { useReactiveVar } from "@apollo/client";
import { Fade, Modal } from "@mui/material";

import { modalStateVar } from "apollo";

import { ConfirmationModal } from "./ConfirmationModal";
import { HostsForm } from "./HostsForm";
import { NodesForm } from "./NodesForm";
import { LocationsForm } from "./LocationsForm";

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
  hostsForm: HostsForm,
  nodesForm: NodesForm,
  locationsForm: LocationsForm,
};

export function RootModal() {
  const modalState = useReactiveVar(modalStateVar);

  const modalType: IModalTypes = modalState?.modalType;

  const modalProps = modalState.modalProps;

  const { onClose } = modalState?.modalOptions || {};

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
        <div>
          <SpecifiedModal {...modalProps} />
        </div>
      </Fade>
    </Modal>
  );
}
