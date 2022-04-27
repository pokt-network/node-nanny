import { useEffect, useState } from "react";
import { useFormik, FormikErrors } from "formik";
import { ApolloQueryResult } from "@apollo/client";
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
  useCheckValidHaProxyLazyQuery,
  useCreateNodeMutation,
  useUpdateNodeMutation,
} from "types";
import { ModalHelper, regexTest, s } from "utils";

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

  const getNodeName = (): string => {
    if (values.chain && values.host) {
      const chainName = formData?.chains?.find(({ id }) => id === values.chain)?.name;
      const hostName = formData?.hosts?.find(({ id }) => id === values.host)?.name;
      let nodeName = `${hostName}/${chainName}`;

      const count = String(
        (nodeNames?.filter((name) => name.includes(nodeName))?.length || 0) + 1,
      ).padStart(2, "0");

      return `${nodeName}/${count}`;
    } else {
      return "";
    }
  };

  // TO-DO -> Split frontend creation fields into their own form
  const handleFormSubmit = async () => {
    setLoading(true);

    if (values.haProxy && values.backend) {
      const { data } = await checkValidHaProxy();

      if (data?.validHaProxy) {
        update ? submitUpdate() : submitCreate();
      } else {
        setLoading(false);
        setErrors({
          ...errors,
          backend: `Backend ${
            values.backend
          } is not a valid backend for the selected load balancer${s(
            values.loadBalancers.length,
          )}. Please ensure the backend string you have entered exactly matches a valid backend string in your haproxy.cfg file`,
        });
      }
    } else if (!values.haProxy && values.frontend) {
      const { data } = await checkValidHaProxy();

      if (data?.validHaProxy) {
        update ? submitUpdate() : submitCreate();
      } else {
        setLoading(false);
        setErrors({
          ...errors,
          frontend: `Frontend ${values.frontend} is not a valid frontend for the selected load balancer. Please ensure the frontend string you have entered exactly matches a valid frontend string in your haproxy.cfg file`,
        });
      }
    } else {
      update ? submitUpdate() : submitCreate();
    }
  };

  /* ----- Form Validation ----- */
  const validate = (values: INodeInput): FormikErrors<INodeInput> => {
    const errors: FormikErrors<INodeInput> = {};
    if (!values.chain) errors.chain = "Chain is required";
    if (!values.host) errors.host = "Host is required";
    if (https && !hostHasFqdn) {
      errors.host = "Host does not have an FQDN so HTTPS cannot be enabled";
    }
    if (!values.port) errors.port = "Port is required";
    if (values.port && !regexTest(String(values.port), "port")) {
      errors.port = "Invalues port number";
    }
    if (hostPortCombos.includes(`${values.host}/${values.port}`)) {
      errors.port = "Host/port combination is already taken";
    }
    if (values.haProxy) {
      if (!values.backend) {
        errors.backend = "Backend is required if HAProxy enabled.";
      }
      if (!values.loadBalancers?.length) {
        errors.loadBalancers = "At least one load balancer is required.";
      }
    } else {
      if (values.frontend && !values.host) {
        errors.frontend =
          "A load balancer host must be selected if creating a frontend node.";
      }
    }
    return errors;
  };

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setErrors,
    setFieldValue,
    resetForm,
  } = useFormik({
    initialValues: {
      https: false,
      name: "",
      chain: "",
      host: "",
      port: undefined,
      haProxy: true,
      backend: "",
      loadBalancers: [],
      server: "",
      frontend: "",
    },
    validate,
    validateOnChange: false,
    onSubmit: handleFormSubmit,
  });

  useEffect(() => {
    if (formData?.hosts && values.host) {
      const hostHasFqdn = Boolean(
        formData.hosts.find(({ id }) => id === values.host)?.fqdn,
      );
      if (!hostHasFqdn) {
        setHttps(false);
        setFieldValue("https", false);
      }
      setHostHasFqdn(hostHasFqdn);
    }
  }, [values.host, formData, setFieldValue]);

  useEffect(() => {
    if (!values.haProxy) {
      setFieldValue("backend", "");
      setFieldValue("frontend", "");
      setFieldValue("server", "");
      setFieldValue("loadBalancers", []);
      setErrors({ ...errors, backend: null, loadBalancers: null });
    }
  }, [values.haProxy]);

  /* ----- Update Mode ----- */
  if (update && selectedNode) {
    hostPortCombos = hostPortCombos.filter(
      (combo) => combo !== `${selectedNode.host.id}/${selectedNode.port}`,
    );
  }

  useEffect(() => {
    if (update && selectedNode) {
      setFieldValue("name", selectedNode.name);
      setFieldValue("chain", selectedNode.chain.id);
      setFieldValue("host", selectedNode.host.id);
      setFieldValue("https", selectedNode.url.includes("https"));
      setFieldValue(
        "loadBalancers",
        selectedNode.loadBalancers.map(({ id }) => id),
      );
      setFieldValue("port", Number(selectedNode.port));
      setFieldValue("backend", selectedNode.backend);
      setFieldValue("frontend", selectedNode.frontend);
      setFieldValue("server", selectedNode.server);
      setFieldValue("haProxy", selectedNode.haProxy);
    }
  }, [update, selectedNode, setFieldValue]);

  /* ----- Mutations ----- */
  const [submitCreate] = useCreateNodeMutation({
    variables: { input: { ...values, name: getNodeName(), port: Number(values.port) } },
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
    variables: {
      update: {
        id: selectedNode?.id,
        ...values,
        name: getNodeName(),
        port: Number(values.port),
      },
    },
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

  /* ----- Queries ----- */
  const [checkValidHaProxy] = useCheckValidHaProxyLazyQuery({
    variables: { input: { ...values, name: getNodeName(), port: Number(values.port) } },
  });

  /* ----- Layout ----- */
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Paper style={{ width: 700, padding: 32 }} variant="outlined">
          <Typography align="center" variant="h5">
            {`${update ? "Update" : "Add New"} Node`}
          </Typography>
          <Typography align="center" variant="h6" gutterBottom>
            {getNodeName()}
          </Typography>
          <Typography align="center" gutterBottom>
            Required Fields
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
                checked={values.https}
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
          <Typography align="center" gutterBottom>
            Load Balancer Settings
          </Typography>
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
          <FormControl fullWidth>
            <TextField
              name="backend"
              value={values.backend}
              onChange={handleChange}
              disabled={!!values.frontend || !values.haProxy}
              label="Backend"
              variant="outlined"
              error={!!errors.backend}
              helperText={errors.backend}
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <FormControl fullWidth error={!!errors.loadBalancers}>
            <InputLabel id="lb-label">Load Balancers</InputLabel>
            <Select
              name="loadBalancers"
              multiple
              labelId="lb-label"
              value={values.loadBalancers}
              onChange={handleChange}
              disabled={!!values.frontend || !values.haProxy}
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
            {!!errors.loadBalancers && (
              <FormHelperText>{errors.loadBalancers}</FormHelperText>
            )}
          </FormControl>
          <div style={{ marginTop: "10px" }} />{" "}
          <FormControl fullWidth>
            <TextField
              name="server"
              value={values.server}
              onChange={handleChange}
              disabled={!!values.frontend || !values.haProxy}
              label="Server (optional)"
              variant="outlined"
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
          <Typography align="center" gutterBottom>
            Set Node as Load Balancer Frontend
          </Typography>
          <FormControl fullWidth>
            <TextField
              name="frontend"
              value={values.frontend}
              onChange={handleChange}
              disabled={!!values.backend || values.haProxy}
              label="Frontend (optional)"
              variant="outlined"
              error={!!errors.frontend}
              helperText={errors.frontend}
            />
          </FormControl>
          <div style={{ marginTop: "10px" }} />
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
              fullWidth
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
