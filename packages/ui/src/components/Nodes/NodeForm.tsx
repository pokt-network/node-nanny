import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  IChain,
  IHost,
  INode,
  INodeInput,
  INodesQuery,
  INodeUpdate,
  IGetHostsChainsAndLoadBalancersQuery,
  useCheckValidHaProxyLazyQuery,
  useCreateNodeMutation,
  useUpdateNodeMutation,
  useDeleteNodeMutation,
} from "types";
import { ModalHelper, s, SnackbarHelper } from "utils";
import Form from "components/Form";
import { NodeActionsState } from "pages/Nodes";

export interface NodesFormProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
  frontendHostChainCombos: string[];
  selectedNode?: INode;
  setSelectedNode: Dispatch<SetStateAction<INode>>;
  frontend?: boolean;
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
  frontendHostChainCombos,
  refetchNodes,
  selectedNode,
  setSelectedNode,
  frontend,
  update,
  read,
  onCancel,
  setState,
}: NodesFormProps) => {
  const [https, setHttps] = useState(false);
  const [hostHasFqdn, setHostHasFqdn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [frontendExists, setFrontendExists] = useState(false);

  const urlRef = useRef<HTMLInputElement>();
  const chainRef = useRef<HTMLInputElement>();
  const hostRef = useRef<HTMLInputElement>();
  const loadBalancersRef = useRef<HTMLInputElement>();

  useEffect(() => {
    setBackendError("");
  }, [selectedNode]);

  /* ----- Form Validation ----- */
  const handleFormSubmit = async () => {
    try {
      setLoading(true);

      if (values.automation || frontend) {
        const { data } = await checkValidHaProxy();

        if (data?.validHaProxy) {
          update
            ? submitUpdate({
                variables: {
                  update: getUpdateValues(selectedNode, values as INodeUpdate),
                },
              })
            : submitCreate({
                variables: {
                  input: { ...values, name: getNodeName(), url: getNodeUrl() },
                },
              });
        } else {
          setLoading(false);
          const newErrors = frontend
            ? {
                ...errors,
                frontend: `Frontend ${values.frontend} is not a valid frontend for the selected load balancer. Please ensure the frontend string you have entered exactly matches a valid frontend string in your haproxy.cfg file`,
              }
            : {
                ...errors,
                backend: `Backend ${
                  values.backend
                } is not a valid backend for the selected load balancer${s(
                  values.loadBalancers.length,
                )}. Please ensure the backend string you have entered exactly matches a valid backend string in your haproxy.cfg file.`,
              };
          setErrors(newErrors);
        }
      } else {
        update
          ? submitUpdate({
              variables: { update: getUpdateValues(selectedNode, values as INodeUpdate) },
            })
          : submitCreate({
              variables: { input: { ...values, name: getNodeName(), url: getNodeUrl() } },
            });
      }
    } catch (error: any) {
      setBackendError(error.message);
    }
  };

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
    if (values.automation) {
      if (!values.backend) {
        errors.backend = "Backend is required";
      }
      if (!values.loadBalancers?.length) {
        errors.loadBalancers = "At least one load balancer is required";
      }
      if (!values.server) {
        errors.server = "Server is required";
      }
    }
    if (frontend) {
      if (!values.frontend) {
        errors.frontend = "Frontend is required";
      }
      if (!values.basicAuth.split(":")[0] || !values.basicAuth.split(":")[1]) {
        errors.basicAuth = "Username and password are required";
      }
    }
    return errors;
  };

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
    setErrors,
    resetForm,
  } = useFormik({
    initialValues: {
      https: false,
      chain: "",
      host: "",
      name: "",
      url: "",
      port: "",
      automation: true,
      backend: "",
      loadBalancers: [],
      server: "",
      frontend: "",
      basicAuth: "",
    },
    validate,
    validateOnChange: false,
    onSubmit: handleFormSubmit,
  });

  const handleBasicAuthChange = ({ target }) => {
    const { name, value } = target;
    const username = `${name === "username" ? value : values.basicAuth.split(":")[0]}`;
    const password = `${name === "password" ? value : values.basicAuth.split(":")[1]}`;
    const newValue = `${username}:${password}`;
    setFieldValue("basicAuth", newValue);
  };

  useEffect(() => {
    if (!values.automation || frontend) {
      setFieldValue("backend", "");
      setFieldValue("loadBalancers", []);
      setFieldValue("server", "");
    }
    if (!frontend) {
      setFieldValue("frontend", "");
      setFieldValue("basicAuth", "");
    }
  }, [values.automation, frontend, setFieldValue]);

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

  const getNodeName = useCallback(() => {
    if (values.chain && values.host) {
      const chainName = formData?.chains?.find(({ id }) => id === values.chain)?.name;
      const hostName = formData?.hosts?.find(({ id }) => id === values.host)?.name;
      let nodeName = `${hostName}/${chainName}`;

      if (frontend) {
        return `frontend-${nodeName}`;
      } else {
        const existingNodeCount =
          nodeNames?.filter((name) => name.includes(nodeName))?.length || 0;
        const count = String(existingNodeCount + 1).padStart(2, "0");
        return `${nodeName}/${count}`;
      }
    } else {
      return "";
    }
  }, [values.chain, values.host, frontend, formData.chains, formData.hosts, nodeNames]);

  const getNodeUrl = useCallback(() => {
    if (values.host && values.port) {
      const host = formData?.hosts?.find(({ id }) => id === values.host);
      const hostDomain = host?.ip || host?.fqdn;
      const protocol = `http${values.https ? "s" : ""}`;
      return `${protocol}://${hostDomain}:${values.port}`;
    } else {
      return "";
    }
  }, [values.host, values.port, values.https, formData.hosts]);

  useEffect(() => {
    if (frontend) {
      const hostChainCombo = `${values.host}/${values.chain}`;
      const frontendExists = frontendHostChainCombos.includes(hostChainCombo);
      setFrontendExists(frontendExists);
    }
  }, [values.host, values.chain, frontend, frontendHostChainCombos]);

  /* ----- Update Mode ----- */
  if (update && selectedNode) {
    nodeNames = nodeNames.filter((name) => name !== selectedNode.name);
    hostPortCombos = hostPortCombos.filter(
      (combo) => combo !== `${selectedNode.host.id}/${selectedNode.port}`,
    );
  }

  const getUpdateValues = useCallback(
    (selectedNode: INode, values: INodeUpdate): INodeUpdate => {
      const newValues: INodeUpdate = { id: selectedNode?.id };

      Object.entries({ ...selectedNode, port: String(selectedNode?.port) }).forEach(
        ([key, value]) => {
          if (key === "chain" || key === "host") {
            if ((value as IChain | IHost)?.id !== values[key]) {
              newValues[key] = values[key];
            }
          } else if (key === "url") {
            const https = (value as string).includes("https");
            if (values.https !== https) {
              newValues.https = values.https;
            }
          } else if ((values[key]?.length ?? values[key]) && values[key] !== value) {
            newValues[key] = values[key];
          }
        },
      );
      if (newValues.chain || newValues.host) {
        newValues.name = getNodeName();
      }
      if (newValues.host || newValues.port || newValues.https) {
        newValues.url = getNodeUrl();
      }
      return newValues;
    },
    [getNodeName, getNodeUrl],
  );

  const handleResetFormState = useCallback(() => {
    setFieldValue("chain", selectedNode.chain.id);
    setFieldValue("host", selectedNode.host.id);
    setFieldValue("https", selectedNode.url.includes("https"));
    setFieldValue(
      "loadBalancers",
      selectedNode.loadBalancers.map(({ id }) => id),
    );
    setFieldValue("name", selectedNode.name);
    setFieldValue("port", String(selectedNode.port));
    setFieldValue("backend", selectedNode.backend);
    setFieldValue("frontend", selectedNode.frontend);
    setFieldValue("server", selectedNode.server);
    setFieldValue("automation", selectedNode.automation);
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
      handleResetRefs();
      resetForm();
    }
  }, [update, selectedNode, resetForm, handleResetFormState, handleResetRefs, frontend]);

  /* ----- Queries ----- */
  const [checkValidHaProxy] = useCheckValidHaProxyLazyQuery({
    variables: {
      input: {
        ...values,
        name: getNodeName(),
        url: getNodeUrl(),
      },
    },
  });

  /* ----- Mutations ----- */
  const [submitCreate] = useCreateNodeMutation({
    onCompleted: ({ createNode }) => {
      SnackbarHelper.open({ text: `Node ${createNode.name} successfully created!` });
      resetForm();
      refetchNodes();
      setLoading(false);
      setState(NodeActionsState.Info);
      setSelectedNode({ ...createNode } as INode);
    },
    onError: (error) => {
      setBackendError(error.message);
      setLoading(false);
    },
  });

  const [submitUpdate] = useUpdateNodeMutation({
    onCompleted: ({ updateNode }) => {
      SnackbarHelper.open({ text: `Node ${updateNode.name} successfully updated!` });
      resetForm();
      refetchNodes();
      setLoading(false);
      setState(NodeActionsState.Info);
      setSelectedNode({ ...updateNode } as INode);
    },
    onError: (error) => {
      setBackendError(error.message);
      setLoading(false);
    },
  });

  const [submitDelete] = useDeleteNodeMutation({
    onCompleted: ({ deleteNode }) => {
      SnackbarHelper.open({ text: `Node ${deleteNode.name} successfully deleted!` });
      refetchNodes();
      ModalHelper.close();
      setState(NodeActionsState.Info);
    },
    onError: (error) => ModalHelper.setError(error.message),
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
      },
    });
  };

  /* ----- Layout ----- */
  return (
    <>
      <Form read={read}>
        {!read && (
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
        )}
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
              {(frontend ? formData?.loadBalancers : formData?.hosts).map(
                ({ name, id, location }) => (
                  <MenuItem key={id} value={id}>
                    {`${name} - ${location.name}`}
                  </MenuItem>
                ),
              )}
            </Select>
            {!!errors.host && <FormHelperText>{errors.host}</FormHelperText>}
          </FormControl>
        )}
        <FormControl fullWidth disabled={read}>
          <InputLabel>HTTPS</InputLabel>
          <Box>
            <FormControlLabel
              control={
                read && !selectedNode ? (
                  <></>
                ) : (
                  <Switch
                    name="https"
                    checked={values.https}
                    onChange={handleChange}
                    disabled={read || !hostHasFqdn}
                  />
                )
              }
              label={
                read || !values.host
                  ? ""
                  : hostHasFqdn
                  ? "Selected host has a FQDN"
                  : "Selected host does not have a FQDN"
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
        {!frontend && (
          <>
            <FormControl fullWidth disabled={read}>
              <InputLabel>Automation</InputLabel>
              <Box>
                {read && !selectedNode ? (
                  <></>
                ) : (
                  <Switch
                    name="automation"
                    checked={values.automation}
                    onChange={handleChange}
                  />
                )}
              </Box>
            </FormControl>
            {values.automation && (
              <>
                <TextField
                  name="backend"
                  value={values.backend}
                  onChange={handleChange}
                  disabled={read ?? (!!values.frontend || !values.automation)}
                  label="Backend"
                  variant="outlined"
                  size="small"
                  fullWidth
                  error={!!errors.backend}
                  helperText={errors.backend}
                />
                {read && (
                  <TextField
                    ref={loadBalancersRef}
                    name="loadBalancers"
                    value={formData?.loadBalancers
                      .filter((lb) => values.loadBalancers.includes(lb.id))
                      ?.map((lb) => lb.name)
                      ?.join(", ")}
                    onChange={handleChange}
                    label="Load Balancers"
                    variant="outlined"
                    error={!!errors.loadBalancers}
                    helperText={errors.loadBalancers}
                    disabled={read ?? (!!values.frontend || !values.automation)}
                    size="small"
                  />
                )}
                {!read && (
                  <FormControl
                    fullWidth
                    disabled={read ?? (!!values.frontend || !values.automation)}
                    error={!!errors.loadBalancers}
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
                              formData?.loadBalancers!.find(({ id: lb }) => lb === id)!
                                .name,
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
                    {!!errors.loadBalancers && (
                      <FormHelperText>{errors.loadBalancers}</FormHelperText>
                    )}
                  </FormControl>
                )}
                <TextField
                  name="server"
                  value={values.server}
                  onChange={handleChange}
                  label="Server"
                  variant="outlined"
                  disabled={read ?? (!!values.frontend || !values.automation)}
                  size="small"
                  fullWidth
                  error={!!errors.server}
                  helperText={errors.server}
                />
              </>
            )}
          </>
        )}
        {frontend && (
          <>
            <TextField
              name="frontend"
              value={values.frontend}
              onChange={handleChange}
              label="Frontend"
              variant="outlined"
              size="small"
              fullWidth
              error={!!errors.frontend}
              helperText={errors.frontend}
            />
            <TextField
              name="username"
              value={values.basicAuth?.split(":")[0]}
              onChange={handleBasicAuthChange}
              label="Username"
              variant="outlined"
              size="small"
              fullWidth
              error={!!errors.basicAuth}
              helperText={errors.basicAuth}
            />
            <TextField
              name="password"
              value={values.basicAuth?.split(":")[1]}
              onChange={handleBasicAuthChange}
              label="Password"
              variant="outlined"
              size="small"
              fullWidth
              error={!!errors.basicAuth}
              helperText={errors.basicAuth}
            />
          </>
        )}
        {frontend && frontendExists && (
          <Alert severity="error">
            <AlertTitle>Frontend Record Exists</AlertTitle>
            {`A frontend record already exists for the given host/chain combination.`}
          </Alert>
        )}
        {!read && (
          <Box
            sx={{
              marginTop: 4,
              textAlign: "right",
              "& button": { margin: 1 },
            }}
          >
            <Button
              type="submit"
              variant="contained"
              onClick={handleSubmit as any}
              disabled={
                (frontend && frontendExists) ||
                (update &&
                  !Object.keys(
                    getUpdateValues(selectedNode, values as INodeUpdate),
                  ).filter((key) => key !== "id")?.length)
              }
              sx={{ width: frontend ? 160 : 125, height: 36.5 }}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                `${update ? "Save" : "Create"} ${frontend ? "Frontend" : "Node"}`
              )}
            </Button>
            <Button onClick={handleCancel} color="error" variant="outlined">
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
              sx={{ width: frontend ? 160 : 125, height: 36.5 }}
            >
              Update Node
            </Button>
            <Button onClick={handleOpenDeleteModal} color="error" variant="outlined">
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
