import { modalStateVar } from "apollo";
import { IModalState } from "../components/modals/RootModal";

export class ModalHelper {
  static open = ({ modalType, modalProps, modalOptions }: IModalState): void => {
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
