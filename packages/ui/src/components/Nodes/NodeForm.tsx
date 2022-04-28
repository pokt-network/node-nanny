import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { useFormik, FormikErrors } from "formik";
import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  TextField,
} from "@mui/material";

import {
  INode,
  INodeInput,
  INodesQuery,
  IGetHostsChainsAndLoadBalancersQuery,
  useCreateNodeMutation,
  useUpdateNodeMutation,
  useDeleteNodeMutation,
} from "types";
import { ModalHelper } from "utils";
import Form from "components/Form";
import { NodeActionsState } from "pages/Nodes";

export interface NodesFormProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  frontendNodeHosts: string[];
  selectedNode?: INode;
  update?: boolean;
  read?: boolean;
  refetchNodes: (variables?: any) => Promise<ApolloQueryResult<INodesQuery>>;
  onCancel?: Dispatch<any>;
  setState?: Dispatch<NodeActionsState>;
}

export const NodeForm = ({
  formData,
  nodeNames,
  hostPortCombos,
  frontendNodeHosts,
  refetchNodes,
  selectedNode,
  update,
  read,
  onCancel,
  setState,
}: NodesFormProps) => {
  const [https, setHttps] = useState(false);
  const [hostHasFqdn, setHostHasFqdn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [frontendBool, setFrontendBool] = useState(!!selectedNode?.frontend);
  const [frontendExists, setFrontendExists] = useState(false);

  const urlRef = useRef<HTMLInputElement>();
  const chainRef = useRef<HTMLInputElement>();
  const hostRef = useRef<HTMLInputElement>();
  const loadBalancersRef = useRef<HTMLInputElement>();

  /* ----- Form Validation ----- */
  const validate = (values: INodeInput): FormikErrors<INodeInput> => {
    const errors: FormikErrors<INodeInput> = {};
    if (!values.chain) errors.chain = "Chain is required";
    if (!values.host) errors.host = "Host is required";
    if (https && !hostHasFqdn) {
      errors.host = "Host does not have an FQDN so HTTPS cannot be enabled";
    }
    if (!values.port) errors.port = "Port is required";
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
    }
    if (values.frontend && values.haProxy) {
      errors.haProxy = "HaProxy cannot be selected if frontend is checked";
      errors.haProxy = "Frontend cannot be selected if HaProxy is checked";
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
      chain: "",
      host: "",
      name: "",
      url: "",
      port: undefined,
      haProxy: true,
      backend: "",
      loadBalancers: [],
      server: "",
      frontend: "",
    },
    validate,
    validateOnChange: false,
    onSubmit: async () => {
      setLoading(true);
      update ? submitUpdate() : submitCreate();
    },
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
    if (update) {
      if (frontendBool && !values.haProxy) {
        if (selectedNode?.frontend) setFieldValue("frontend", selectedNode.frontend);
        if (selectedNode?.frontend) setFrontendBool(!!selectedNode.frontend);
        setFieldValue("backend", "");
        setFieldValue("server", "");
        setFieldValue("loadBalancers", []);
        setErrors({ ...errors, backend: null, loadBalancers: null });
      }
      if (!frontendBool && values.haProxy) {
        setFieldValue("frontend", "");
        setFrontendBool(false);
        if (selectedNode?.backend) setFieldValue("backend", selectedNode?.backend);
        if (selectedNode?.server) setFieldValue("server", selectedNode?.server);
        if (selectedNode?.loadBalancers)
          setFieldValue(
            "loadBalancers",
            selectedNode?.loadBalancers.map((lb) => lb.id),
          );
      }
    }
  }, [
    update,
    errors,
    setErrors,
    setFieldValue,
    selectedNode,
    values.haProxy,
    frontendBool,
  ]);

  const getNodeName = useCallback(() => {
    if (values.chain && values.host) {
      const chainName = formData?.chains?.find(({ id }) => id === values.chain)?.name;
      const hostName = formData?.hosts?.find(({ id }) => id === values.host)?.name;
      let nodeName = `${hostName}/${chainName}`;
      const count = String(
        (nodeNames?.filter((name) => name.includes(nodeName))?.length || 0) + 1,
      ).padStart(2, "0");
      return `${frontendBool ? "frontend-" : ""}${nodeName}/${count}`;
    } else {
      return "";
    }
  }, [values.chain, values.host, frontendBool]);

  const getNodeUrl = useCallback(() => {
    if (values.host && values.port) {
      const host = formData?.hosts?.find(({ id }) => id === values.host);
      const hostDomain = host?.ip || host?.fqdn;
      const protocol = `http${values.https ? "s" : ""}`;
      return `${protocol}://${hostDomain}:${values.port}`;
    } else {
      return "";
    }
  }, [values.host, values.port, values.https]);

  useEffect(() => {
    console.log(frontendNodeHosts, values.host);
    setFrontendExists(frontendNodeHosts.includes(values.host));
  }, [values.host]);

  /* ----- Update Mode ----- */
  if (update && selectedNode) {
    nodeNames = nodeNames.filter((name) => name !== selectedNode.name);
    hostPortCombos = hostPortCombos.filter(
      (combo) => combo !== `${selectedNode.host.id}/${selectedNode.port}`,
    );
  }

  const handleResetFormState = useCallback(() => {
    setFieldValue("chain", selectedNode.chain.id);
    setFieldValue("host", selectedNode.host.id);
    setFieldValue("https", selectedNode.url.includes("https"));
    setFieldValue(
      "loadBalancers",
      selectedNode.loadBalancers.map(({ id }) => id),
    );
    setFieldValue("name", selectedNode.name);
    setFieldValue("port", Number(selectedNode.port));
    setFieldValue("backend", selectedNode.backend);
    setFieldValue("frontend", selectedNode.frontend);
    setFrontendBool(!!selectedNode.frontend);
    setFieldValue("server", selectedNode.server);
    setFieldValue(
      "haProxy",
      typeof selectedNode.haProxy === "boolean" ? selectedNode.haProxy : false,
    );
  }, [setFieldValue, selectedNode]);

  const handleResetRefs = useCallback(() => {
    if (urlRef.current) {
      urlRef.current.querySelector("input").value = "";
    }
    if (chainRef.current) {
      chainRef.current.querySelector("input").value = "";
    }
    if (hostRef.current) {
      hostRef.current.querySelector("input").value = "";
    }
    if (loadBalancersRef.current) {
      loadBalancersRef.current.querySelector("input").value = "";
    }
  }, []);

  const handleCancel = (e) => {
    if (update) {
      handleResetFormState();
    }
    onCancel(e);
  };

  useEffect(() => {
    if (update && selectedNode) {
      handleResetFormState();
      handleResetRefs();
    }
    if (!selectedNode) {
      setFrontendBool(false);
      handleResetRefs();
      resetForm({
        values: {
          https: false,
          chain: "",
          haProxy: false,
          host: "",
          url: "",
          name: "",
          port: "" as unknown as number,
          loadBalancers: [],
          backend: "",
          server: "",
          frontend: "",
        },
      });
    }
  }, [update, selectedNode, resetForm, handleResetFormState, handleResetRefs]);

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

  const [submitDelete, { error: deleteNodeError }] = useDeleteNodeMutation({
    onCompleted: () => {
      refetchNodes();
      ModalHelper.close();
    },
  });

  const handleOpenDeleteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => submitDelete({ variables: { id: selectedNode?.id } }),
        confirmText: `Delete: ${selectedNode?.name}`,
        promptText: `Are you sure you wish to remove host ${selectedNode?.name} from the inventory database?`,
        okText: "Delete Host",
        okColor: "error",
        cancelColor: "inherit",
        error: deleteNodeError?.message,
      },
    });
  };

  /* ----- Layout ----- */
  return (
    <>
      <Form read={read}>
        <TextField
          name="name"
          value={getNodeName()}
          onChange={handleChange}
          label="Name"
          variant="outlined"
          disabled
          size="small"
          sx={{
            "& fieldset": { borderWidth: "0px !important" },
          }}
        />
        <TextField
          name="url"
          ref={urlRef}
          value={getNodeUrl()}
          onChange={handleChange}
          label="URL"
          variant="outlined"
          disabled
          size="small"
          sx={{
            "& fieldset": { borderWidth: "0px !important" },
          }}
        />
        {read && (
          <TextField
            ref={chainRef}
            name="chain"
            value={formData?.chains.find((chain) => chain.id === values.chain)?.name}
            onChange={handleChange}
            label="Chain"
            variant="outlined"
            error={!!errors.chain}
            helperText={errors.chain}
            disabled={read}
            size="small"
          />
        )}
        {!read && (
          <FormControl fullWidth error={!!errors.chain}>
            <InputLabel id="chain-label">Chain</InputLabel>
            <Select
              name="chain"
              labelId="chain-label"
              value={values.chain}
              label="Chain"
              onChange={handleChange}
              size="small"
            >
              {formData?.chains.map(({ name, id }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </Select>
            {!!errors.chain && <FormHelperText>{errors.chain}</FormHelperText>}
          </FormControl>
        )}
        {read && (
          <TextField
            ref={hostRef}
            name="host"
            value={formData.hosts
              .filter((host) => host.id === values.host)
              ?.map((host) => `${host.name} - ${host.location.name}`)}
            onChange={handleChange}
            label="Host"
            variant="outlined"
            error={!!errors.host}
            helperText={errors.host}
            disabled={read}
            size="small"
            fullWidth
          />
        )}
        {!read && (
          <FormControl fullWidth error={!!errors.host}>
            <InputLabel id="host-label">Host</InputLabel>
            <Select
              name="host"
              labelId="host-label"
              value={values.host}
              label="Host"
              onChange={handleChange}
              size="small"
            >
              {formData?.hosts.map(({ name, id, location }) => (
                <MenuItem key={id} value={id}>
                  {`${name} - ${location.name}`}
                </MenuItem>
              ))}
            </Select>
            {!!errors.host && <FormHelperText>{errors.host}</FormHelperText>}
          </FormControl>
        )}
        <FormControl fullWidth disabled={read}>
          <InputLabel>HTTPS</InputLabel>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  name="https"
                  checked={values.https}
                  onChange={handleChange}
                  disabled={read ? read : !hostHasFqdn}
                />
              }
              label={
                !values.host || (update && !selectedNode)
                  ? ""
                  : hostHasFqdn
                  ? "Selected host has an FQDN; HTTPS may be enabled"
                  : "Selected host does not have an FQDN"
              }
            />
          </Box>
        </FormControl>
        <TextField
          name="port"
          value={values.port}
          onChange={handleChange}
          label="Port"
          variant="outlined"
          error={!!errors.port}
          helperText={errors.port}
          disabled={read}
          size="small"
          fullWidth
        />
        <FormControl fullWidth disabled={read ? read : frontendBool}>
          <InputLabel>HAproxy</InputLabel>
          <Box>
            <Switch name="haProxy" checked={values.haProxy} onChange={handleChange} />
          </Box>
        </FormControl>
        {values.haProxy && (
          <>
            <TextField
              name="backend"
              value={values.backend}
              onChange={handleChange}
              disabled={read ?? (!!values.frontend || !values.haProxy)}
              label="Backend"
              variant="outlined"
              size="small"
              fullWidth
            />
            {read && (
              <TextField
                ref={loadBalancersRef}
                name="loadBalancers"
                value={formData
                  ?.loadBalancers!.filter((lb) => values.loadBalancers.includes(lb.id))
                  ?.map((lb) => lb.name)
                  ?.join(", ")}
                onChange={handleChange}
                label="Load Balancers"
                variant="outlined"
                error={!!errors.loadBalancers}
                helperText={errors.loadBalancers}
                disabled={read ?? (!!values.frontend || !values.haProxy)}
                size="small"
              />
            )}
            {!read && (
              <FormControl
                fullWidth
                disabled={read ?? (!!values.frontend || !values.haProxy)}
              >
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
                  size="small"
                >
                  {formData?.loadBalancers.map(({ name, id }) => (
                    <MenuItem key={id} value={id}>
                      <Checkbox checked={values.loadBalancers.indexOf(id!) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              name="server"
              value={values.server}
              onChange={handleChange}
              label="Server"
              variant="outlined"
              disabled={read ?? (!!values.frontend || !values.haProxy)}
              size="small"
              fullWidth
            />
          </>
        )}
        <FormControl
          fullWidth
          disabled={frontendExists || read ? read : !!values.haProxy}
        >
          <InputLabel>Frontend</InputLabel>
          <Box>
            <Switch
              name="frontendBool"
              checked={frontendBool}
              onChange={(_, checked) => setFrontendBool(checked)}
            />
          </Box>
        </FormControl>
        {frontendBool && (
          <TextField
            name="frontend"
            value={values.frontend}
            onChange={handleChange}
            disabled={read ?? values.haProxy}
            label="Frontend"
            variant="outlined"
            size="small"
            fullWidth
          />
        )}

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
                `${update ? "Save" : "Create"} Node`
              )}
            </Button>
            <Button onClick={handleCancel} variant="outlined" color="inherit">
              Cancel
            </Button>
          </Box>
        )}
        {selectedNode && read && (
          <Box
            sx={{
              marginTop: 4,
              textAlign: "right",
              "& button": { margin: 1 },
            }}
          >
            <Button
              onClick={() => setState(NodeActionsState.Edit)}
              variant="contained"
              color="primary"
            >
              Update Node
            </Button>
            <Button onClick={handleOpenDeleteModal} variant="outlined" color="error">
              Delete Node
            </Button>
          </Box>
        )}
        {backendError && (
          <Alert severity="error">
            <AlertTitle>{`Error ${update ? "Updating" : "Creating"} Node`}</AlertTitle>
            {backendError}
          </Alert>
        )}
      </Form>
    </>
  );
};

export default NodeForm;
