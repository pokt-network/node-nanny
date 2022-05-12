import { Dispatch, useEffect, useState } from 'react';
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

import { IOracle, IOraclesQuery, useUpdateOracleMutation } from 'types';
import { ModalHelper, regexTest, SnackbarHelper } from 'utils';
import { PNFActionsState } from 'pages/PNF';
import Form from 'components/Form';

interface IOracleUpdateFormValues {
  chain: string;
  urls: string;
}

interface OraclesFormProps {
  selectedOracle: IOracle;
  refetchOracles: (variables?: any) => Promise<ApolloQueryResult<IOraclesQuery>>;
  onCancel?: Dispatch<any>;
  setState?: Dispatch<PNFActionsState>;
}

export const OraclesForm = ({
  selectedOracle,
  refetchOracles,
  onCancel,
  setState,
}: OraclesFormProps) => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');

  /* ----- Form Validation ----- */
  const validate = (
    values: IOracleUpdateFormValues,
  ): FormikErrors<IOracleUpdateFormValues> => {
    const errors: FormikErrors<IOracleUpdateFormValues> = {};
    const urlsArray = values.urls.split('\n');
    if (!urlsArray?.length) errors.urls = 'At least one oracle URL is required';
    if (urlsArray?.length && urlsArray.some((url) => !regexTest(url, 'url'))) {
      errors.urls = 'One or more URLs are invalid';
    }

    return errors;
  };

  const { values, errors, handleChange, handleSubmit, resetForm, setFieldValue } =
    useFormik({
      initialValues: {
        chain: selectedOracle?.chain,
        urls: selectedOracle?.urls?.join('\n') || '',
      },
      validate,
      validateOnChange: false,
      onSubmit: async () => {
        setLoading(true);
        submitUpdate({
          variables: {
            update: {
              chain: selectedOracle?.chain,
              urls: values.urls.trim().split('\n'),
            },
          },
        });
      },
    });

  const handleCancel = (e) => {
    onCancel(e);
  };

  /* ----- Update Mode ----- */
  const [submitUpdate] = useUpdateOracleMutation({
    onCompleted: () => {
      SnackbarHelper.open({
        text: `Oracles for ${selectedOracle.chain} successfully updated!`,
      });
      resetForm();
      refetchOracles();
      ModalHelper.close();
      setLoading(false);
      setState(PNFActionsState.Info);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    setFieldValue('urls', selectedOracle.urls.join('\n'));
  }, [selectedOracle, setFieldValue]);

  /* ----- Layout ----- */
  return (
    <Form>
      <TextField
        multiline
        name="urls"
        value={values.urls}
        onChange={(e) => handleChange(e)}
        label="Oracle URLs"
        variant="outlined"
        rows={6}
        error={!!errors.urls}
        helperText={errors.urls}
        size="small"
        fullWidth
      />
      <Box
        sx={{
          marginTop: 4,
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
          disabled={selectedOracle.urls?.join('\n') === values.urls.trim()}
        >
          {loading ? <CircularProgress size={20} color="secondary" /> : 'Save Oracles'}
        </Button>
        <Button
          onClick={handleCancel}
          color="error"
          variant="outlined"
          sx={{ width: 150, height: 36.5 }}
        >
          Cancel
        </Button>
      </Box>

      {backendError && (
        <Alert severity="error">
          <AlertTitle>{'Error Updating Oracle'}</AlertTitle>
          {backendError}
        </Alert>
      )}
    </Form>
  );
};

export default OraclesForm;
