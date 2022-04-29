import { makeVar } from "@apollo/client";
import { IModalState } from "../components/modals/RootModal";
import { SnackBarProps } from "components/Snackbar";

const modalStateInitialValue: IModalState = {
  modalType: undefined,
  modalProps: undefined,
  modalOptions: undefined,
};
export const modalStateVar = makeVar(modalStateInitialValue);

const snackbarStateInitialValue: SnackBarProps = {
  open: false,
  text: "",
  type: undefined,
};
export const snackbarStateVar = makeVar(snackbarStateInitialValue);
