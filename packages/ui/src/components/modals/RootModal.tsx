import { useReactiveVar } from '@apollo/client';
import { Fade, Modal, Box } from '@mui/material';

import { modalStateVar } from 'apollo';

import { ConfirmationModal } from './ConfirmationModal';
import { CSVConfirmationModal } from './CSVConfirmationModal';

export type IModalTypes = 'confirmation' | 'csvConfirmation';

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
  csvConfirmation: CSVConfirmationModal,
};

export function RootModal() {
  const modalState = useReactiveVar(modalStateVar);

  const modalType: IModalTypes = modalState?.modalType;

  const modalProps = modalState.modalProps;

  const { onClose } = modalState?.modalOptions || {
    onClose: () =>
      modalStateVar({
        modalType: undefined,
        modalProps: undefined,
        modalOptions: undefined,
      }),
  };

  if (!modalType) {
    return null;
  }

  const open: boolean = !!modalType;
  const SpecifiedModal = MODAL_TYPES[modalType];

  const maxWidth = {
    confirmation: '600px',
    csvConfirmation: '90%',
  }[modalType];

  return (
    <Modal
      aria-labelledby={`${modalType}-modal`}
      open={open}
      onClose={() => onClose?.()}
      closeAfterTransition
      BackdropProps={{ timeout: 500 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'scroll',
      }}
    >
      <Fade in={open}>
        <Box sx={{ m: 2, width: '100%', maxWidth, maxHeight: '90%' }}>
          <SpecifiedModal {...modalProps} />
        </Box>
      </Fade>
    </Modal>
  );
}
