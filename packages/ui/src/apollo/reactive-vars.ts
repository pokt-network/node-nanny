import { makeVar } from "@apollo/client";
import { ModalState } from "../components/modals/RootModal";

const modalStateInitialValue: ModalState = {
  modalType: undefined,
  modalProps: undefined,
  modalOptions: undefined,
};
export const modalStateVar = makeVar(modalStateInitialValue);
