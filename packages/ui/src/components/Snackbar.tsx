import { useReactiveVar } from '@apollo/client';
import { Alert, AlertColor, Snackbar as MUISnackbar } from '@mui/material';

import { snackbarStateVar } from 'apollo';

export interface SnackBarProps {
  text?: string;
  open?: boolean;
  type?: AlertColor;
}

export const Snackbar: React.FC = () => {
  const { open, text, type } = useReactiveVar(snackbarStateVar);

  const close = (): void => {
    snackbarStateVar({ open: false, type: 'success' });
  };

  return (
    <MUISnackbar
      open={open}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={close}
    >
      <Alert severity={type} sx={{ width: '100%' }}>
        {text}
      </Alert>
    </MUISnackbar>
  );
};

export default Snackbar;
