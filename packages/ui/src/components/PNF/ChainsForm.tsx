import {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useFormik, FormikErrors } from 'formik';
import { ApolloQueryResult } from '@apollo/client';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';

import {
  IHost,
  IHostInput,
  IHostsQuery,
  IHostUpdate,
  ILocation,
  useCreateHostMutation,
  useDeleteHostMutation,
  useUpdateHostMutation,
} from 'types';
import { ModalHelper, regexTest, s, SnackbarHelper } from 'utils';
import { HostActionsState } from 'pages/Hosts';
import Form from 'components/Form';

interface HostsFormProps {
  locations: ILocation[];
  hostNames: string[];
  hostsWithNode: { [id: string]: number };
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
  selectedHost?: IHost;
  setSelectedHost: Dispatch<SetStateAction<IHost>>;
  update?: boolean;
  read?: boolean;
  onCancel?: Dispatch<any>;
  setState?: Dispatch<HostActionsState>;
}

export const ChainsForm = ({
  locations,
  hostNames,
  hostsWithNode,
  refetchHosts,
  selectedHost,
  setSelectedHost,
  update,
  read,
  onCancel,
  setState,
}: HostsFormProps) => {
  const [ipDisabled, setIPDisabled] = useState(false);
  const [fqdnDisabled, setFQDNDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [deleteHostError, setDeleteHostError] = useState('');

  const locationRef = useRef<HTMLInputElement>();

  useEffect(() => {
    setBackendError('');
    setDeleteHostError('');
  }, [selectedHost]);

  /* ----- Form Validation ----- */
  const validate = (values: IHostInput): FormikErrors<IHostInput> => {
    const errors: FormikErrors<IHostInput> = {};
    if (!values.location) errors.location = 'Location is required';
    if (!values.name) errors.name = 'Name is required';
    if (hostNames.includes(values.name)) errors.name = 'Name is already taken';
    if (!values.ip && !values.fqdn) {
      errors.ip = 'Either IP or FQDN is required';
      errors.fqdn = 'Either IP or FQDN is required';
    }
    if (values.ip && !regexTest(values.ip.trim(), 'ip')) errors.ip = 'Not a valid IP';
    if (values.fqdn && !regexTest(values.fqdn.trim(), 'fqdn'))
      errors.fqdn = 'Not a valid FQDN';

    return errors;
  };

  const { values, errors, handleChange, handleSubmit, setFieldValue, resetForm } =
    useFormik({
      initialValues: { location: '', name: '', ip: '', fqdn: '', loadBalancer: false },
      validate,
      validateOnChange: false,
      onSubmit: async () => {
        setLoading(true);
        update
          ? submitUpdate({
              variables: { update: getUpdateValues(selectedHost, values as IHostUpdate) },
            })
          : submitCreate({ variables: { input: values } });
      },
    });

  useEffect(() => {
    if (values.fqdn) {
      setIPDisabled(true);
    } else {
      setIPDisabled(false);
    }
  }, [values.fqdn]);

  useEffect(() => {
    if (values.ip) {
      setFQDNDisabled(true);
    } else {
      setFQDNDisabled(false);
    }
  }, [values.ip]);

  const handleResetFormState = useCallback(() => {
    setFieldValue('location', selectedHost.location.id);
    setFieldValue('name', selectedHost.name);
    setFieldValue('ip', selectedHost.ip ?? '');
    setFieldValue('fqdn', selectedHost.fqdn ?? '');
    setFieldValue('loadBalancer', selectedHost.loadBalancer);
  }, [setFieldValue, selectedHost]);

  const handleResetRefs = useCallback(() => {
    if (locationRef.current) {
      locationRef.current.querySelector('input').value = '';
    }
  }, []);

  const handleCancel = (e) => {
    if (update) {
      handleResetFormState();
    }
    onCancel(e);
  };

  /* ----- Update Mode ----- */
  if (update && selectedHost) {
    hostNames = hostNames.filter((name) => name !== selectedHost.name);
  }

  const getUpdateValues = (selectedHost: IHost, values: IHostUpdate): IHostUpdate => {
    const newValues: IHostUpdate = { id: selectedHost?.id };

    Object.entries(selectedHost).forEach(([key, value]) => {
      if (key === 'location') {
        if ((value as ILocation)?.id !== values[key]) {
          newValues[key] = values[key];
        }
      } else if (
        (typeof values[key] === 'boolean' || values[key]) &&
        values[key] !== value
      ) {
        newValues[key] = values[key];
      }
    });

    return newValues;
  };

  useEffect(() => {
    if (update && selectedHost) {
      handleResetFormState();
      handleResetRefs();
    }
    if (!selectedHost) {
      handleResetRefs();
      resetForm();
    }
  }, [update, selectedHost, resetForm, handleResetFormState, handleResetRefs]);

  /* ----- Mutations ----- */
  const [submitCreate] = useCreateHostMutation({
    onCompleted: ({ createHost }) => {
      SnackbarHelper.open({ text: `Host ${createHost.name} successfully created!` });
      resetForm();
      refetchHosts();
      ModalHelper.close();
      setLoading(false);
      setState(HostActionsState.Info);
      setSelectedHost({ ...createHost } as IHost);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateHostMutation({
    onCompleted: ({ updateHost }) => {
      SnackbarHelper.open({ text: `Host ${updateHost.name} successfully updated!` });
      resetForm();
      refetchHosts();
      ModalHelper.close();
      setLoading(false);
      setState(HostActionsState.Info);
      setSelectedHost({ ...updateHost } as IHost);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  const [submitDelete] = useDeleteHostMutation({
    onCompleted: ({ deleteHost }) => {
      SnackbarHelper.open({ text: `Host ${deleteHost.name} successfully deleted!` });
      refetchHosts();
      ModalHelper.close();
    },
    onError: (error) => {
      setDeleteHostError(error.message);
      ModalHelper.close();
    },
  });

  const handleOpenDeleteModal = () => {
    setDeleteHostError('');
    const { id: hostId, name } = selectedHost;

    if (hostId in hostsWithNode) {
      const num = hostsWithNode[hostId];
      setDeleteHostError(
        `Host ${name} has ${num} Node${s(
          num,
        )}; to delete this host first delete all nodes associated with it.`,
      );
    } else {
      ModalHelper.open({
        modalType: 'confirmation',
        modalProps: {
          handleOk: () => submitDelete({ variables: { id: hostId } }),
          confirmText: `Delete: ${name}`,
          promptText: `Are you sure you wish to remove host ${name} from the inventory database?`,
          okText: 'Delete Host',
          okColor: 'error',
          cancelColor: 'inherit',
        },
      });
    }
  };

  /* ----- Layout ----- */
  return (
    <Form read={read}>
      {read && (
        <TextField
          ref={locationRef}
          name="location"
          value={locations?.find((l) => l.id === values.location)?.name}
          onChange={handleChange}
          label="Location"
          variant="outlined"
          error={!!errors.location}
          helperText={errors.location}
          disabled={read}
          size="small"
        />
      )}
      {!read && (
        <FormControl fullWidth error={!!errors.location}>
          <InputLabel id="location-label">Location</InputLabel>
          <Select
            name="location"
            labelId="location-label"
            value={values.location}
            label="Location"
            onChange={handleChange}
            disabled={read}
            size="small"
          >
            {locations?.map(({ id, name }) => (
              <MenuItem value={id}>{name}</MenuItem>
            ))}
          </Select>
          {!!errors.location && <FormHelperText>{errors.location}</FormHelperText>}
        </FormControl>
      )}
      <TextField
        name="name"
        value={values.name}
        onChange={handleChange}
        label="Host Name"
        variant="outlined"
        error={!!errors.name}
        helperText={errors.name}
        disabled={read}
        size="small"
        fullWidth
      />
      <TextField
        name="ip"
        value={values.ip}
        onChange={handleChange}
        label="Host IP"
        variant="outlined"
        disabled={read ? read : ipDisabled}
        error={!!errors.ip}
        helperText={errors.ip}
        size="small"
        fullWidth
      />
      <TextField
        name="fqdn"
        value={values.fqdn}
        onChange={handleChange}
        label="Host FQDN"
        variant="outlined"
        disabled={read ? read : fqdnDisabled}
        error={!!errors.fqdn}
        helperText={errors.fqdn}
        size="small"
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel disabled={read}>Load Balancer</InputLabel>
        <Box>
          <Switch
            name="loadBalancer"
            checked={values.loadBalancer}
            onChange={handleChange}
            disabled={read}
          />
        </Box>
      </FormControl>
      {read && (
        <TextField
          name="nodes"
          value={hostsWithNode[selectedHost?.id] || 0}
          label="Nodes"
          disabled={true}
          size="small"
        />
      )}
      {!read && (
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
            sx={{ width: 125, height: 36.5 }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              `${update ? 'Save' : 'Create'} Host`
            )}
          </Button>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
        </Box>
      )}
      {selectedHost && read && (
        <Box
          sx={{
            marginTop: 4,
            textAlign: 'right',
            '& button': { margin: 1 },
          }}
        >
          <Button
            onClick={() => setState(HostActionsState.Edit)}
            variant="contained"
            color="primary"
            sx={{ width: 125, height: 36.5 }}
          >
            Update Host
          </Button>
          <Button onClick={handleOpenDeleteModal} color="error" variant="outlined">
            Delete Host
          </Button>
        </Box>
      )}

      {deleteHostError && (
        <Alert severity="error">
          <AlertTitle>{'Cannot delete Host with Nodes'}</AlertTitle>
          {deleteHostError}
        </Alert>
      )}

      {backendError && (
        <Alert severity="error">
          <AlertTitle>{`Error ${update ? 'Updating' : 'Creating'} Host`}</AlertTitle>
          {backendError}
        </Alert>
      )}
    </Form>
  );
};

export default ChainsForm;
