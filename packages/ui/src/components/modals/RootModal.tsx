import { useReactiveVar } from "@apollo/client";
import { Fade, Modal } from "@mui/material";

import { modalStateVar } from "apollo";

import { ConfirmationModal } from "./ConfirmationModal";
import { HostsCSV } from "./HostsCSV";
import { HostsForm } from "./HostsForm";
import { NodesCSV } from "./NodesCSV";
import { NodesForm } from "./NodesForm";
import { LocationsForm } from "./LocationsForm";

export type IModalTypes =
  | "confirmation"
  | "hostsCsv"
  | "hostsForm"
  | "nodesCsv"
  | "nodesForm"
  | "locationsForm";

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
  hostsCsv: HostsCSV,
  hostsForm: HostsForm,
  nodesCsv: NodesCSV,
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
        <div style={{ padding: 32 }}>
          <SpecifiedModal {...modalProps} />
        </div>
      </Fade>
    </Modal>
  );
}
