import { useState, useEffect, Dispatch, useRef } from "react";
import { useFormik, FormikErrors } from "formik";
import { ApolloQueryResult } from "@apollo/client";
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
} from "@mui/material";

import {
  IHost,
  IHostInput,
  IHostsQuery,
  ILocation,
  useCreateHostMutation,
  useDeleteHostMutation,
  useUpdateHostMutation,
} from "types";
import { ModalHelper, regexTest } from "utils";
import { HostActionsState } from "pages/Hosts";
import Form from "components/Form";

interface HostsFormProps {
  locations: ILocation[];
  hostNames: string[];
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
  selectedHost?: IHost;
  update?: boolean;
  read?: boolean;
  onCancel?: Dispatch<any>;
  setState?: Dispatch<HostActionsState>;
}

export const HostForm = ({
  locations,
  hostNames,
  refetchHosts,
  selectedHost,
  update,
  read,
  onCancel,
  setState,
}: HostsFormProps) => {
  const [ipDisabled, setIPDisabled] = useState(false);
  const [fqdnDisabled, setFQDNDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  const locationRef = useRef<HTMLInputElement>();

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
    if (values.ip && !regexTest(values.ip.trim(), "ip")) errors.ip = "Not a valid IP";
    if (values.fqdn && !regexTest(values.fqdn.trim(), "fqdn"))
      errors.fqdn = "Not a valid FQDN";

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
      setFieldValue("ip", selectedHost.ip ?? "");
      setFieldValue("fqdn", selectedHost.fqdn ?? "");
      setFieldValue("loadBalancer", selectedHost.loadBalancer);
    }
    if (!selectedHost) {
      resetForm();
      if (locationRef.current) {
        locationRef.current.querySelector("input").value = "";
      }
    }
  }, [update, selectedHost, setFieldValue, resetForm]);

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

  const [submitDelete, { error: deleteHostError }] = useDeleteHostMutation({
    onCompleted: () => {
      refetchHosts();
      ModalHelper.close();
    },
  });

  const handleOpenDeleteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => submitDelete({ variables: { id: selectedHost?.id } }),
        confirmText: `Delete: ${selectedHost?.name}`,
        promptText: `Are you sure you wish to remove host ${selectedHost?.name} from the inventory database?`,
        okText: "Delete Host",
        okColor: "error",
        cancelColor: "inherit",
        error: deleteHostError?.message,
      },
    });
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
        disabled={read ?? ipDisabled}
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
        disabled={read ?? fqdnDisabled}
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
      {!read && (
        <Box
          sx={{
            marginTop: 4,
            textAlign: "right",
            "& button": { margin: 1 },
          }}
        >
          <Button type="submit" variant="contained" onClick={handleSubmit as any}>
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              `${update ? "Save" : "Create"} Host`
            )}
          </Button>
          <Button onClick={onCancel} variant="outlined" color="inherit">
            Cancel
          </Button>
        </Box>
      )}
      {selectedHost && read && (
        <Box
          sx={{
            marginTop: 4,
            textAlign: "right",
            "& button": { margin: 1 },
          }}
        >
          <Button
            onClick={() => setState(HostActionsState.Edit)}
            variant="contained"
            color="primary"
          >
            Update Host
          </Button>
          <Button onClick={handleOpenDeleteModal} variant="outlined" color="error">
            Delete Host
          </Button>
        </Box>
      )}
      {backendError && (
        <Alert severity="error">
          <AlertTitle>{`Error ${update ? "Updating" : "Creating"} Host`}</AlertTitle>
          {backendError}
        </Alert>
      )}
    </Form>
  );
};

export default HostForm;
