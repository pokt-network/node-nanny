import { useState, useEffect } from "react";
import { useFormik, FormikErrors } from "formik";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  IHost,
  IHostInput,
  IHostsQuery,
  ILocation,
  useCreateHostMutation,
  useUpdateHostMutation,
} from "types";
import { ModalHelper, regexTest } from "utils";

interface HostsFormProps {
  locations: ILocation[];
  hostNames: string[];
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
  selectedHost?: IHost;
  update?: boolean;
}

export function HostsForm({
  locations,
  hostNames,
  refetchHosts,
  selectedHost,
  update,
}: HostsFormProps) {
  const [ipDisabled, setIPDisabled] = useState(false);
  const [fqdnDisabled, setFQDNDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  /* ----- Form Validation ----- */
  const validate = (values: IHostInput): FormikErrors<IHostInput> => {
    const errors: FormikErrors<IHostInput> = {};
    if (!values.location) errors.location = "Location is required";
    if (!values.name) errors.name = "Name is required";
    if (hostNames.includes(values.name)) errors.name = "Name is already taken";
    if (!values.ip && !values.fqdn) {
      errors.ip = "Either IP or FQDN is required";
      errors.fqdn = "Either IP or FQDN is required";
    }
    if (values.ip && !regexTest(values.ip, "ip")) errors.ip = "Not a valid IP";
    if (values.fqdn && !regexTest(values.fqdn, "fqdn")) errors.fqdn = "Not a valid FQDN";

    return errors;
  };
  const { values, errors, handleChange, handleSubmit, setFieldValue, resetForm } =
    useFormik({
      initialValues: { location: "", name: "", ip: "", fqdn: "", loadBalancer: false },
      validate,
      validateOnChange: false,
      onSubmit: async () => {
        setLoading(true);
        update ? submitUpdate() : submitCreate();
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

  /* ----- Update Mode ----- */
  if (update && selectedHost) {
    hostNames = hostNames.filter((name) => name !== selectedHost.name);
  }
  useEffect(() => {
    if (update && selectedHost) {
      setFieldValue("location", selectedHost.location.id);
      setFieldValue("name", selectedHost.name);
      setFieldValue("ip", selectedHost.ip);
      setFieldValue("fqdn", selectedHost.fqdn);
      setFieldValue("loadBalancer", selectedHost.loadBalancer);
    }
  }, [update, selectedHost, setFieldValue]);

  /* ----- Mutations ----- */
  const [submitCreate] = useCreateHostMutation({
    variables: { input: values },
    onCompleted: () => {
      resetForm();
      refetchHosts();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateHostMutation({
    variables: { update: { id: selectedHost?.id, ...values } },
    onCompleted: () => {
      resetForm();
      refetchHosts();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (backendError) => {
      setBackendError(backendError.message);
      setLoading(false);
    },
  });

  /* ----- Layout ----- */
  return (
    <>
      <div>
        <Paper style={{ width: 700, padding: 32 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            {`${update ? "Update" : "Add New"} Host`}
          </Typography>
          <FormControl fullWidth error={!!errors.location}>
            <InputLabel id="location-label">Location</InputLabel>
            <Select
              name="location"
              labelId="location-label"
              value={values.location}
              label="Location"
              onChange={handleChange}
            >
              {locations?.map(({ id, name }) => (
                <MenuItem value={id}>{name}</MenuItem>
              ))}
            </Select>
            {!!errors.location && <FormHelperText>{errors.location}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth>
            <div style={{ marginTop: "10px" }} />
            <TextField
              name="name"
              value={values.name}
              onChange={handleChange}
              label="Host Name"
              variant="outlined"
              error={!!errors.name}
              helperText={errors.name}
            />
            <div style={{ marginTop: "10px" }} />
            <TextField
              name="ip"
              value={values.ip}
              onChange={handleChange}
              label="Host IP"
              variant="outlined"
              disabled={ipDisabled}
              error={!!errors.ip}
              helperText={errors.ip}
            />
            <div style={{ marginTop: "10px" }} />
            <TextField
              name="fqdn"
              value={values.fqdn}
              onChange={handleChange}
              label="Host FQDN"
              variant="outlined"
              disabled={fqdnDisabled}
              error={!!errors.fqdn}
              helperText={errors.fqdn}
            />
            <div>
              Load Balancer
              <Switch
                name="loadBalancer"
                checked={values.loadBalancer}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                onClick={ModalHelper.close}
                style={{ height: 40, width: 150 }}
                variant="contained"
                color="error"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  height: 40,
                  width: 150,
                }}
                variant="contained"
                color="success"
                onClick={handleSubmit as any}
              >
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  `${update ? "Update" : "Create"} Host`
                )}
              </Button>
            </div>
          </FormControl>
          {backendError && (
            <Alert severity="error">
              <AlertTitle>{`Error ${update ? "Updating" : "Creating"} Host`}</AlertTitle>
              {backendError}
            </Alert>
          )}
        </Paper>
      </div>
    </>
  );
}
