import { snackbarStateVar } from "apollo";
import { SnackBarProps } from "components/Snackbar";

export class SnackbarHelper {
  static open = ({ text, type }: SnackBarProps): void => {
    snackbarStateVar({
      text,
      open: true,
      type: type || "success",
    });
  };
}
