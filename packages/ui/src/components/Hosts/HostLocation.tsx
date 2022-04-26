import { Dispatch, useState } from "react";
import { useFormik, FormikErrors } from "formik";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  FormControl,
  TextField,
} from "@mui/material";

import Paper from "components/Paper"
import Title from "components/Title"
import { ILocationsQuery, useCreateLocationMutation } from "types";
import { ModalHelper } from "utils";
import { HostActionsState } from "pages/Hosts";

interface ILocationInput {
  name: string;
}

export interface NodesFormProps {
  locationNames: string[];
  refetchLocations: (variables?: any) => Promise<ApolloQueryResult<ILocationsQuery>>;
  setState: Dispatch<HostActionsState>
}

export const HostLocation = ({ locationNames, refetchLocations, setState }: NodesFormProps) => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  /* ----- Form Validation ----- */
  const validate = (values: { name: string }): FormikErrors<ILocationInput> => {
    const errors: FormikErrors<{ name: string }> = {};
    if (!values.name) errors.name = "Name is required";
    if (locationNames.includes(values.name)) errors.name = "Name is already taken";
    return errors;
  };

  const { values, errors, handleChange, handleSubmit } = useFormik({
    initialValues: { name: "" },
    validate,
    validateOnChange: false,
    onSubmit: async () => {
      setLoading(true);
      createLocation({ variables: { name: values.name.toUpperCase() } });
    },
  });

  /* ----- Create Location----- */
  const [createLocation] = useCreateLocationMutation({
    onCompleted: () => {
      refetchLocations();
      ModalHelper.close();
    },
    onError: (error) => {
      setLoading(false);
      setBackendError(error.message);
    },
  });

  /* ----- Layout ----- */
  return (
    <Paper>
      <Title>Add New Location</Title>
      <FormControl fullWidth style={{ marginBottom: 8 }}>
        <TextField
          name="name"
          value={values.name.toUpperCase()}
          onChange={handleChange}
          label="Name"
          variant="outlined"
          error={!!errors.name}
          helperText={errors.name}
        />
      </FormControl>
      <Box
        sx={{ 
          marginTop: 4,
          textAlign: "center",
          '& button': { margin: 1 }
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit as any}
        >
          {loading ? <CircularProgress size={20} /> : "Add New Location"}
        </Button>
        <Button
          onClick={() => setState(HostActionsState.Info)}
          variant="outlined"
          color="error"
        >
          Cancel
        </Button>
      </Box>
      {backendError && (
        <Alert severity="error">
          <AlertTitle>{"Error Adding Location"}</AlertTitle>
          {backendError}
        </Alert>
      )}
    </Paper>
  );
}

export default HostLocation