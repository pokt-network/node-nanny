import { modalStateVar } from "apollo";
import { ModalState } from "../components/modals/RootModal";

export class ModalHelper {
  static open = ({ modalType, modalProps, modalOptions }: ModalState): void => {
    modalStateVar({
      modalType,
      modalProps,
      modalOptions,
    });
  };

  static close = (): void => {
    modalStateVar({
      modalType: undefined,
      modalProps: undefined,
      modalOptions: undefined,
    });
  };
}
