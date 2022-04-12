import { useEffect, useState } from "react";
import { ApolloQueryResult } from "@apollo/client";
import { useFormik, FormikErrors } from "formik";
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  INode,
  INodeInput,
  INodesQuery,
  IGetHostsChainsAndLoadBalancersQuery,
  useCreateNodeMutation,
  useUpdateNodeMutation,
} from "types";
import { ModalHelper } from "utils";

export interface NodesFormProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  selectedNode?: INode;
  update?: boolean;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
}

export function NodesForm({
  formData,
  nodeNames,
  hostPortCombos,
  refetchNodes,
  selectedNode,
  update,
}: NodesFormProps) {
  const [https, setHttps] = useState(false);
  const [hostHasFqdn, setHostHasFqdn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  if (update && selectedNode) {
    nodeNames = nodeNames.filter((name) => name !== selectedNode.name);
    hostPortCombos = hostPortCombos.filter(
      (combo) => combo !== `${selectedNode.host.id}/${selectedNode.port}`,
    );
  }
  const validate = (values: INodeInput): FormikErrors<INodeInput> => {
    const errors: FormikErrors<INodeInput> = {};
    if (!values.chain) errors.chain = "Chain is required";
    if (!values.host) errors.host = "Host is required";
    if (https && !hostHasFqdn) {
      errors.host = "Host does not have an FQDN so HTTPS cannot be enabled";
    }
    if (!values.name) errors.name = "Name is required";
    if (nodeNames.includes(values.name)) errors.name = "Name is already taken";
    if (!values.port) errors.port = "Port is required";
    if (hostPortCombos.includes(`${values.host}/${values.port}`)) {
      errors.port = "Host/port combination is already taken";
    }
    return errors;
  };
  const { values, errors, handleChange, handleSubmit, setFieldValue, resetForm } =
    useFormik({
      initialValues: {
        https: false,
        chain: "",
        haProxy: false,
        host: "",
        name: "",
        port: undefined,
        loadBalancers: [],
        backend: "",
        server: "",
      },
      validate,
      validateOnChange: false,
      onSubmit: async () => {
        setLoading(true);
        update ? submitUpdate() : submitCreate();
      },
    });

  const [submitCreate] = useCreateNodeMutation({
    variables: { input: values },
    onCompleted: () => {
      resetForm();
      refetchNodes();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (error) => {
      setBackendError(error.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateNodeMutation({
    variables: { update: { id: selectedNode?.id, ...values } },
    onCompleted: () => {
      resetForm();
      refetchNodes();
      ModalHelper.close();
      setLoading(false);
    },
    onError: (error) => {
      setBackendError(error.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    if (update && selectedNode) {
      setFieldValue("chain", selectedNode.chain.id);
      setFieldValue("host", selectedNode.host.id);
      setFieldValue("url", selectedNode.url.includes("https"));
      setFieldValue(
        "loadBalancers",
        selectedNode.loadBalancers.map(({ id }) => id),
      );
      setFieldValue("name", selectedNode.name);
      setFieldValue("port", selectedNode.port);
      setFieldValue("backend", selectedNode.backend);
      setFieldValue("server", selectedNode.server);
      setFieldValue("haProxy", selectedNode.haProxy);
    }
  }, [update, selectedNode, setFieldValue]);

  useEffect(() => {
    if (formData?.hosts && values.host) {
      const hostHasFqdn = Boolean(
        formData.hosts.find(({ id }) => id === values.host)?.fqdn,
      );
      if (!hostHasFqdn) setHttps(false);
      setHostHasFqdn(hostHasFqdn);
    }
  }, [values.host, formData]);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Paper style={{ width: 700, padding: 32 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            {`${update ? "Update" : "Add New"} Node`}
          </Typography>
          <FormControl fullWidth error={!!errors.chain}>
            <InputLabel id="chain-label">Chain</InputLabel>
            <Select
              name="chain"
              labelId="chain-label"
              value={values.chain}
              label="Chain"
              onChange={handleChange}
            >
              {formData?.chains.map(({ name, id }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </Select>
            {!!errors.chain && <FormHelperText>{errors.chain}</FormHelperText>}
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth error={!!errors.host}>
            <InputLabel id="host-label">Host</InputLabel>
            <Select
              name="host"
              labelId="host-label"
              value={values.host}
              label="Host"
              onChange={handleChange}
            >
              {formData?.hosts.map(({ name, id, location }) => (
                <MenuItem key={id} value={id}>
                  {`${name} - ${location.name}`}
                </MenuItem>
              ))}
            </Select>
            {!!errors.host && <FormHelperText>{errors.host}</FormHelperText>}
          </FormControl>
          <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              HTTPS
              <Switch
                name="https"
                checked={https}
                onChange={handleChange}
                disabled={!hostHasFqdn}
              />
              {values.host && (
                <Typography>
                  {hostHasFqdn
                    ? "Selected host has an FQDN; HTTPS may be enabled."
                    : "Selected host does not have an FQDN; HTTPS is disabled."}
                </Typography>
              )}
            </div>
          </div>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              name="name"
              value={values.name}
              onChange={handleChange}
              label="Name"
              variant="outlined"
              error={!!errors.name}
              helperText={errors.name}
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              name="port"
              value={values.port}
              onChange={handleChange}
              label="Port"
              variant="outlined"
              error={!!errors.port}
              helperText={errors.port}
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <InputLabel id="lb-label">Load Balancers</InputLabel>
            <Select
              name="loadBalancers"
              multiple
              labelId="lb-label"
              value={values.loadBalancers}
              onChange={handleChange}
              input={<OutlinedInput label="Load Balancers" />}
              renderValue={(selected) => {
                return selected
                  .map(
                    (id) =>
                      formData?.loadBalancers!.find(({ id: lb }) => lb === id)!.name,
                  )
                  .join(", ");
              }}
            >
              {formData?.loadBalancers.map(({ name, id }) => (
                <MenuItem key={id} value={id}>
                  <Checkbox checked={values.loadBalancers.indexOf(id!) > -1} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              name="backend"
              value={values.backend}
              onChange={handleChange}
              label="Backend"
              variant="outlined"
            />
          </FormControl>

          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth>
            <TextField
              name="server"
              value={values.server}
              onChange={handleChange}
              label="Server"
              variant="outlined"
            />
          </FormControl>
          <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              HAproxy
              <Switch name="haProxy" checked={values.haProxy} onChange={handleChange} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              onClick={ModalHelper.close}
              style={{ height: 40, width: 150 }}
              variant="contained"
            >
              Cancel
            </Button>
            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
                height: 40,
                width: 150,
              }}
              variant="contained"
              onClick={handleSubmit as any}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                `${update ? "Update" : "Create"} Node`
              )}
            </Button>
          </div>
          {backendError && (
            <Alert severity="error">
              <AlertTitle>{`Error ${update ? "Updating" : "Creating"} Node`}</AlertTitle>
              {backendError}
            </Alert>
          )}
        </Paper>
      </div>
    </>
  );
}
