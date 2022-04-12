import { makeVar } from "@apollo/client";
import { IModalState } from "../components/modals/RootModal";

const modalStateInitialValue: IModalState = {
  modalType: undefined,
  modalProps: undefined,
  modalOptions: undefined,
};
export const modalStateVar = makeVar(modalStateInitialValue);
