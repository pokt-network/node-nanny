import { useEffect, useState } from 'react';

import Paper from 'components/Paper';
import Title from 'components/Title';
import { ModalHelper } from 'utils';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';

export interface ConfirmationModalProps {
  handleOk: any;
  promptText: string;
  okText?: string;
  confirmText?: string;
  okColor?: Color;
  cancelColor?: Color;
  error?: string;
}

type Color =
  | 'inherit'
  | 'success'
  | 'error'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'warning';

export function ConfirmationModal({
  handleOk,
  promptText,
  okText,
  confirmText,
  okColor,
  cancelColor,
  error,
}: ConfirmationModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      setLoading(false);
    }
  }, [error]);

  return (
    <Paper>
      {confirmText && <Title>{confirmText}</Title>}
      <Typography>
        {promptText.includes('\n')
          ? promptText
              .split('\n')
              .map((line) => <Typography gutterBottom>{line}</Typography>)
          : promptText}
      </Typography>
      <Box
        sx={{
          marginTop: 4,
          textAlign: 'right',
          '& button': { margin: 1 },
        }}
      >
        <Button
          onClick={() => {
            setLoading(true);
            handleOk();
          }}
          variant="contained"
          color={okColor || 'primary'}
          sx={{ width: 132 }}
        >
          {loading ? (
            <CircularProgress size={20} color="secondary" style={{ marginRight: 8 }} />
          ) : (
            okText || 'OK'
          )}
        </Button>
        <Button
          onClick={() => ModalHelper.close()}
          variant="outlined"
          color={cancelColor || 'inherit'}
        >
          Cancel
        </Button>
      </Box>
      {error && (
        <Alert severity="error">
          <AlertTitle>{'Error:'}</AlertTitle>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
