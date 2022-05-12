import { Dispatch, useState } from 'react';
import { useFormik, FormikErrors } from 'formik';
import { ApolloQueryResult } from '@apollo/client';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';

import Paper from 'components/Paper';
import Title from 'components/Title';
import {
  ILocation,
  ILocationsQuery,
  useCreateLocationMutation,
  useDeleteLocationMutation,
} from 'types';
import { ModalHelper, s } from 'utils';
import { HostActionsState } from 'pages/Hosts';

interface ILocationInput {
  name: string;
}

export interface NodesFormProps {
  locations: ILocation[];
  locationsWithHost: { [id: string]: number };
  refetchLocations: (variables?: any) => Promise<ApolloQueryResult<ILocationsQuery>>;
  setState: Dispatch<HostActionsState>;
}

export const HostLocation = ({
  locations,
  locationsWithHost,
  refetchLocations,
  setState,
}: NodesFormProps) => {
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [deleteLocationError, setDeleteLocationError] = useState('');

  const locationNames = locations.map(({ name }) => name);

  /* ----- Form Validation ----- */
  const validate = (values: { name: string }): FormikErrors<ILocationInput> => {
    const errors: FormikErrors<{ name: string }> = {};
    if (!values.name) errors.name = 'Name is required';
    if (locationNames.includes(values.name)) errors.name = 'Name is already taken';
    return errors;
  };

  const { values, handleChange, handleSubmit } = useFormik({
    initialValues: { name: '' },
    validate,
    validateOnChange: false,
    onSubmit: async () => {
      setLoading(true);
      createLocation({ variables: { name: values.name.toUpperCase() } });
    },
  });

  /* ----- Create Location----- */
  const [createLocation, { error: addLocationError }] = useCreateLocationMutation({
    onCompleted: () => {
      refetchLocations();
      setState(HostActionsState.Info);
    },
    onError: () => setLoading(false),
  });
  const [deleteLocation] = useDeleteLocationMutation({
    variables: { id: locationId },
    onCompleted: () => {
      refetchLocations();
      ModalHelper.close();
      setLocationId('');
      setState(HostActionsState.Info);
    },
    onError: (error) => {
      setDeleteLocationError(error.message);
      setLoading(false);
      ModalHelper.close();
    },
  });

  const handleOpenConfirmModal = () => {
    ModalHelper.open({
      modalType: 'confirmation',
      modalProps: {
        handleOk: deleteLocation,
        confirmText: `Confirm Delete Location`,
        okText: 'Delete Location',
        promptText: `This will delete the location ${
          locations.find(({ id }) => id === locationId).name
        } from the inventory database. Confirm?`,
      },
    });
  };

  const handleDeleteChange = ({ target }) => {
    setDeleteLocationError('');
    const { value: locationId } = target;

    if (locationId in locationsWithHost) {
      const { name } = locations.find(({ id }) => id === locationId);
      const num = locationsWithHost[locationId];
      setDeleteLocationError(
        `Location ${name} has ${num} host${s(
          num,
        )}; to delete this location first delete all hosts associated with it.`,
      );
    }

    setLocationId(locationId);
  };

  /* ----- Layout ----- */
  return (
    <Paper>
      <>
        <Box
          sx={{
            width: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'space-between',
            justifyContent: 'flex-end',
            gap: 1,
            p: 2,
            mb: 2,
            borderRadius: 1,
            backgroundColor: 'background.default',
          }}
        >
          <Title>Add New Location</Title>
          <FormControl fullWidth>
            <TextField
              name="name"
              value={values.name.toUpperCase()}
              onChange={handleChange}
              label="Name"
              variant="outlined"
              error={!!addLocationError}
              helperText={addLocationError}
            />
          </FormControl>
          <Box
            sx={{
              textAlign: 'center',
              '& button': { margin: 1 },
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="contained" color="primary" onClick={handleSubmit as any}>
              {loading ? (
                <CircularProgress size={20} color="secondary" />
              ) : (
                'Add New Location'
              )}
            </Button>
            <Button
              onClick={() => setState(HostActionsState.Info)}
              color="error"
              variant="outlined"
            >
              Cancel
            </Button>
          </Box>
          {addLocationError && (
            <Alert severity="error">
              <AlertTitle>{'Error Adding Location'}</AlertTitle>
              {addLocationError}
            </Alert>
          )}
        </Box>
        <Box
          sx={{
            width: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'space-between',
            justifyContent: 'center',
            gap: 1,
            p: 2,
            mb: 2,
            borderRadius: 1,
            backgroundColor: 'background.default',
          }}
        >
          <Title>Delete Location</Title>
          <FormControl fullWidth>
            <InputLabel id="location-label">Location</InputLabel>
            <Select
              name="location"
              labelId="location-label"
              value={locationId}
              label="Location"
              onChange={handleDeleteChange}
              disabled={!locations?.length}
            >
              {locations?.map(({ id, name }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            sx={{
              textAlign: 'center',
              '& button': { margin: 1 },
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              disabled={!locations?.length || !!deleteLocationError}
              onClick={handleOpenConfirmModal}
            >
              Delete Location
            </Button>
            <Button
              onClick={() => setState(HostActionsState.Info)}
              color="error"
              variant="outlined"
            >
              Cancel
            </Button>
          </Box>
          {deleteLocationError && (
            <Alert severity="error">
              <AlertTitle>{'Error Adding Location'}</AlertTitle>
              {deleteLocationError}
            </Alert>
          )}
        </Box>
      </>
    </Paper>
  );
};

export default HostLocation;
