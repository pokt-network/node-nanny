import { Dispatch, SetStateAction, useState, useEffect, useCallback } from 'react';
import { useFormik, FormikErrors } from 'formik';
import { ApolloQueryResult } from '@apollo/client';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  TextField,
} from '@mui/material';

import {
  IChain,
  IChainInput,
  IChainsQuery,
  IChainUpdate,
  IOraclesQuery,
  useCreateChainMutation,
  useUpdateChainMutation,
} from 'types';
import { SnackbarHelper } from 'utils';
import { PNFActionsState } from 'pages/PNF';
import Form from 'components/Form';

interface ChainsFormProps {
  selectedChain?: IChain;
  setSelectedChain: Dispatch<SetStateAction<IChain>>;
  update?: boolean;
  read?: boolean;
  chainNames: string[];
  chainIds: string[];
  refetchChains: (variables?: any) => Promise<ApolloQueryResult<IChainsQuery>>;
  refetchOracles: (variables?: any) => Promise<ApolloQueryResult<IOraclesQuery>>;
  onCancel?: Dispatch<any>;
  setState?: Dispatch<PNFActionsState>;
}

export const ChainsForm = ({
  selectedChain,
  setSelectedChain,
  update,
  read,
  chainNames,
  chainIds,
  refetchChains,
  refetchOracles,
  onCancel,
  setState,
}: ChainsFormProps) => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');

  useEffect(() => {
    setBackendError('');
  }, [selectedChain]);

  /* ----- Form Validation ----- */
  const validate = (values: IChainInput): FormikErrors<IChainInput> => {
    const errors: FormikErrors<IChainInput> = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.type) errors.type = 'Type is required';
    if (chainNames.includes(values.name)) errors.name = 'Name is already taken';
    if (!values.chainId) errors.chainId = 'Relay chain ID is required';
    if (chainIds.includes(values.chainId)) {
      errors.chainId = 'Relay chain ID is already taken';
    }

    return errors;
  };

  const { values, errors, handleChange, handleSubmit, setFieldValue, resetForm } =
    useFormik({
      initialValues: { name: '', type: '', allowance: 0, chainId: '' },
      validate,
      validateOnChange: false,
      onSubmit: async () => {
        setLoading(true);
        console.log({ values });
        update
          ? submitUpdate({
              variables: {
                update: getUpdateValues(selectedChain, values as IChainUpdate),
              },
            })
          : submitCreate({ variables: { input: values } });
      },
    });

  const handleResetFormState = useCallback(() => {
    setFieldValue('name', selectedChain?.name || '');
    setFieldValue('type', selectedChain?.type || '');
    setFieldValue('allowance', selectedChain?.allowance || 0);
    setFieldValue('chainId', selectedChain?.chainId || '');
  }, [setFieldValue, selectedChain]);

  const handleCancel = (e) => {
    if (update) {
      handleResetFormState();
    }
    onCancel(e);
  };

  /* ----- Update Mode ----- */
  if (update && selectedChain) {
    chainNames = chainNames.filter((name) => name !== selectedChain.name);
  }

  const getUpdateValues = (selectedChain: IChain, values: IChainUpdate): IChainUpdate => {
    const newValues: IChainUpdate = { id: selectedChain?.id };
    Object.entries(selectedChain).forEach(([key, value]) => {
      if (values[key] && values[key] !== value) newValues[key] = values[key];
    });
    console.log({ newValues });
    return newValues;
  };

  useEffect(() => {
    if (!selectedChain) {
      resetForm();
      setFieldValue('allowance', 0);
    }
  }, [selectedChain, resetForm, setFieldValue]);

  useEffect(() => {
    if (update && selectedChain) {
      handleResetFormState();
    }
  }, [update, selectedChain, handleResetFormState]);

  /* ----- Mutations ----- */
  const [submitCreate] = useCreateChainMutation({
    onCompleted: ({ createChain }) => {
      SnackbarHelper.open({ text: `Chain ${createChain.name} successfully created!` });
      resetForm();
      refetchChains();
      refetchOracles();
      setLoading(false);
      setState(PNFActionsState.Info);
      setSelectedChain({ ...createChain } as IChain);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateChainMutation({
    onCompleted: ({ updateChain }) => {
      SnackbarHelper.open({ text: `Chain ${updateChain.name} successfully updated!` });
      resetForm();
      refetchChains();
      setLoading(false);
      setState(PNFActionsState.Info);
      setSelectedChain({ ...updateChain } as IChain);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  /* ----- Layout ----- */
  return (
    <Form read={read}>
      <TextField
        name="name"
        value={values.name}
        onChange={handleChange}
        label="Chain Name"
        variant="outlined"
        error={!!errors.name}
        helperText={errors.name}
        disabled={read}
        size="small"
        fullWidth
      />
      <TextField
        name="type"
        value={values.type}
        onChange={handleChange}
        label="Chain Type"
        variant="outlined"
        error={!!errors.type}
        helperText={errors.type}
        disabled={read}
        size="small"
        fullWidth
      />
      <TextField
        name="allowance"
        type="number"
        InputProps={{ inputProps: { min: 0 } }}
        value={read && !selectedChain ? null : values.allowance}
        onChange={handleChange}
        label="Chain Allowance"
        variant="outlined"
        error={!!errors.allowance}
        helperText={errors.allowance}
        disabled={read}
        size="small"
        fullWidth
      />
      <TextField
        name="chainId"
        value={values.chainId}
        onChange={handleChange}
        label="Relay Chain ID"
        variant="outlined"
        error={!!errors.chainId}
        helperText={errors.chainId}
        disabled={read}
        size="small"
        fullWidth
      />
      {!read && (
        <Box
          sx={{
            mt: 4,
            mb: 4,
            textAlign: 'right',
            '& button': { margin: 1 },
            width: 125,
            height: 36.5,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            onClick={handleSubmit as any}
            sx={{ width: 150, height: 36.5 }}
          >
            {loading ? (
              <CircularProgress size={20} color="secondary" />
            ) : (
              `${update ? 'Save' : 'Create'} Chain`
            )}
          </Button>
          <Button onClick={handleCancel} color="error" variant="outlined">
            Cancel
          </Button>
        </Box>
      )}
      {selectedChain && read && (
        <Box
          sx={{
            marginTop: 4,
            textAlign: 'right',
            '& button': { margin: 1 },
          }}
        >
          <Button
            onClick={() => setState(PNFActionsState.Edit)}
            variant="contained"
            color="primary"
            sx={{ width: 150, height: 36.5 }}
          >
            Update Chain
          </Button>
          <Button
            onClick={() => setState(PNFActionsState.Oracles)}
            variant="contained"
            color="secondary"
            disabled={selectedChain.type !== 'EVM'}
            sx={{ width: 150, height: 36.5 }}
          >
            {selectedChain.type === 'EVM' ? 'Update Oracles' : 'Non-EVM Chain'}
          </Button>
        </Box>
      )}

      {backendError && (
        <Alert severity="error">
          <AlertTitle>{`Error ${update ? 'Updating' : 'Creating'} Chain`}</AlertTitle>
          {backendError}
        </Alert>
      )}
    </Form>
  );
};

export default ChainsForm;
