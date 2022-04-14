import { useState } from "react";
import { useFormik, FormikErrors } from "formik";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  FormControl,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { ILocationsQuery, useCreateLocationMutation } from "types";
import { ModalHelper } from "utils";

interface ILocationInput {
  name: string;
}

export interface NodesFormProps {
  locationNames: string[];
  refetchLocations: (variables?: any) => Promise<ApolloQueryResult<ILocationsQuery>>;
}

export function LocationsForm({ locationNames, refetchLocations }: NodesFormProps) {
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
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Paper style={{ width: 700, padding: 32 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            Add New Location
          </Typography>
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
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              onClick={ModalHelper.close}
              style={{ height: 40, width: 180 }}
              variant="contained"
              color="error"
            >
              Cancel
            </Button>
            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
                height: 40,
                width: 180,
              }}
              variant="contained"
              color="success"
              onClick={handleSubmit as any}
            >
              {loading ? <CircularProgress size={20} /> : "Add New Location"}
            </Button>
          </div>
          {backendError && (
            <Alert severity="error">
              <AlertTitle>{"Error Adding Location"}</AlertTitle>
              {backendError}
            </Alert>
          )}
        </Paper>
      </div>
    </>
  );
}
