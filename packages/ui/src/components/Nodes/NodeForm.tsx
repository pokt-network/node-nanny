import { Dispatch, useEffect, useRef, useState } from "react";
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
  useDeleteNodeMutation,
} from "types";
import { ModalHelper } from "utils";
import Form from "components/Form";
import { NodeActionsState } from "pages/Nodes";

export interface NodesFormProps {
  formData: IGetHostsChainsAndLoadBalancersQuery;
  nodeNames: string[];
  hostPortCombos: string[];
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
  refetchNodes,
  selectedNode,
  update,
  read,
  onCancel,
  setState,
}: NodesFormProps) => {
  const [backendDisabled, setBackendDisabled] = useState(false);
  const [frontendDisabled, setFrontendDisabled] = useState(false);
  const [https, setHttps] = useState(false);
  const [hostHasFqdn, setHostHasFqdn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

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
        backend: undefined,
        frontend: undefined,
        server: undefined,
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
    if (values.backend) {
      setFrontendDisabled(true);
    } else {
      setFrontendDisabled(false);
    }
  }, [values.backend]);

  useEffect(() => {
    if (values.frontend) {
      setBackendDisabled(true);
    } else {
      setBackendDisabled(false);
    }
  }, [values.frontend]);

  /* ----- Update Mode ----- */
  if (update && selectedNode) {
    nodeNames = nodeNames.filter((name) => name !== selectedNode.name);
    hostPortCombos = hostPortCombos.filter(
      (combo) => combo !== `${selectedNode.host.id}/${selectedNode.port}`,
    );
  }

  useEffect(() => {
    if (update && selectedNode) {
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
      setFieldValue("server", selectedNode.server);
      setFieldValue("haProxy", selectedNode.haProxy);
    }
    if (!selectedNode) {
      resetForm({
        values: {
          https: false,
          chain: "",
          haProxy: false,
          host: "",
          name: "",
          port: undefined,
          loadBalancers: [],
          backend: "",
          frontend: "",
          server: "",
        },
      });
      if (chainRef.current) {
        chainRef.current.querySelector("input").value = "";
      }
      if (hostRef.current) {
        hostRef.current.querySelector("input").value = "";
      }
      if (loadBalancersRef.current) {
        loadBalancersRef.current.querySelector("input").value = "";
      }
    }
  }, [update, selectedNode, setFieldValue]);

  /* ----- Mutations ----- */
  const [submitCreate] = useCreateNodeMutation({
    variables: { input: { ...values, port: Number(values.port) } },
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
    variables: { update: { id: selectedNode?.id, ...values, port: Number(values.port) } },
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
        promptText: `Are you sure you wish to remove host ${selectedNode?.name} from the inventory database?`,
        okText: "Delete Host",
        okColor: "error",
        cancelColor: "primary",
        error: deleteNodeError?.message,
      },
    });
  };

  /* ----- Layout ----- */
  return (
    <>
      <Form read={read}>
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
                  disabled={read ?? !hostHasFqdn}
                />
              }
              label={
                hostHasFqdn
                  ? "Selected host has an FQDN"
                  : "Selected host does not have an FQDN"
              }
            />
          </Box>
        </FormControl>
        <TextField
          name="name"
          value={values.name}
          onChange={handleChange}
          label="Name"
          variant="outlined"
          error={!!errors.name}
          helperText={errors.name}
          disabled={read}
          size="small"
          fullWidth
        />
        <TextField
          name="port"
          value={selectedNode ? values.port : ""}
          onChange={handleChange}
          label="Port"
          variant="outlined"
          error={!!errors.port}
          helperText={errors.port}
          disabled={read}
          size="small"
          fullWidth
        />
        {read && (
          <TextField
            ref={loadBalancersRef}
            name="loadBalancers"
            value={formData.loadBalancers
              .filter((lb) => values.loadBalancers.includes(lb.id))
              ?.map((lb) => lb.name)}
            onChange={handleChange}
            label="Load Balancers"
            variant="outlined"
            error={!!errors.loadBalancers}
            helperText={errors.loadBalancers}
            disabled={read}
            size="small"
          />
        )}
        {!read && (
          <FormControl fullWidth disabled={read}>
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
          name="backend"
          value={values.backend}
          onChange={handleChange}
          disabled={read ?? backendDisabled}
          label="Backend"
          variant="outlined"
          size="small"
          fullWidth
        />
        <TextField
          name="frontend"
          value={values.frontend}
          onChange={handleChange}
          disabled={read ?? frontendDisabled}
          label="Frontend"
          variant="outlined"
          size="small"
          fullWidth
        />
        <TextField
          name="server"
          value={values.server}
          onChange={handleChange}
          label="Server"
          variant="outlined"
          disabled={read}
          size="small"
          fullWidth
        />
        <FormControl fullWidth disabled={read}>
          <InputLabel>HAproxy</InputLabel>
          <Box>
            <Switch name="haProxy" checked={values.haProxy} onChange={handleChange} />
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
                `${update ? "Save" : "Create"} Node`
              )}
            </Button>
            <Button onClick={onCancel} variant="outlined" color="error">
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
