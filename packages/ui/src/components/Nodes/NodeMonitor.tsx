import { Dispatch, SetStateAction, useEffect } from "react";

import Paper from "components/Paper";
import {
  INode,
  useDisableHaProxyServerMutation,
  useEnableHaProxyServerMutation,
  useGetNodeStatusLazyQuery,
  useMuteMonitorMutation,
  useUnmuteMonitorMutation,
} from "types";
import { ModalHelper } from "utils";
import text from "utils/monitor-text";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Grid from "@mui/material/Grid";
import Title from "components/Title";

interface NodeMonitorProps {
  node: INode;
  setSelectedNode: Dispatch<SetStateAction<INode>>;
  title: string;
}

export const NodeMonitor = ({ node, setSelectedNode, title }: NodeMonitorProps) => {
  const [getStatus, { data, error: getHaProxyStatusError, loading }] =
    useGetNodeStatusLazyQuery();
  const [enable, { error: enableHaProxyError }] = useEnableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });
  const [disable, { error: disableHaProxyError }] = useDisableHaProxyServerMutation({
    onCompleted: () => getStatus(),
  });

  useEffect(() => {
    getStatus({ variables: { id: node?.id } });
  }, [node, getStatus]);

  const haProxyOnline = { "0": true, "1": false, "-1": "n/a" }[
    String(data?.haProxyStatus)
  ];
  const haProxyButtonDisabled =
    !node?.haProxy ||
    loading ||
    !!getHaProxyStatusError ||
    typeof haProxyOnline !== "boolean";
  const haProxyStatusText = haProxyOnline ? "Online" : "Offline";
  const haProxyButtonText = `${haProxyOnline ? "Remove" : "Add"} Node ${
    haProxyOnline ? "from" : "to"
  } Rotation`;

  const handleHaProxyButtonClick = (id: string) => {
    haProxyOnline ? disable({ variables: { id } }) : enable({ variables: { id } });
  };

  const handleMuteToggle = (id: string) =>
    node?.muted
      ? unmuteMonitor({ variables: { id } })
      : muteMonitor({ variables: { id } });

  const [muteMonitor, { error: muteMonitorError }] = useMuteMonitorMutation({
    onCompleted: ({ muteMonitor }) => {
      const { muted } = muteMonitor;
      setSelectedNode({ ...node!, muted });
    },
  });
  const [unmuteMonitor, { error: unmuteMonitorError }] = useUnmuteMonitorMutation({
    onCompleted: ({ unmuteMonitor }) => {
      const { muted } = unmuteMonitor;
      setSelectedNode({ ...node!, muted });
    },
  });

  const muteStatusText = !node ? "No Node Selected" : node?.muted ? "Muted" : "Not Muted";

  const handleOpenMuteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleMuteToggle(node?.id),
        confirmText: `Confirm ${node?.muted ? "Unmute" : "Mute"} Node`,
        okText: `${node?.muted ? "Unmute" : "Mute"} Node`,
        promptText: (node?.muted ? text.unmuteMonitor : text.muteMonitor).replaceAll(
          "{selectedNode}",
          node.name,
        ),
        error: (muteMonitorError || unmuteMonitorError)?.message,
      },
    });
  };

  const handleOpenRotationModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => handleHaProxyButtonClick(node?.id),
        confirmText: `Confirm ${haProxyOnline ? "Disable" : "Enable"} Node`,
        okText: `${haProxyOnline ? "Disable" : "Enable"} Node`,
        promptText: (haProxyOnline
          ? text.removeFromRotation
          : text.addToRotation
        ).replaceAll("{node}", node.name),
        error: (enableHaProxyError || disableHaProxyError)?.message,
      },
    });
  };

  return (
    <>
      <Grid item sm={12} md="auto" sx={{ "& button": { marginLeft: 1 } }}>
        <Button
          variant="outlined"
          onClick={handleOpenMuteModal}
          disabled={!node}
          color="secondary"
          size="small"
        >
          {!node
            ? "Toggle Node Monitor"
            : node?.muted
            ? "Unmute Node Monitor"
            : "Mute Node Monitor"}
        </Button>
        <Button
          variant="outlined"
          onClick={handleOpenRotationModal}
          disabled={haProxyButtonDisabled}
          color="warning"
          size="small"
        >
          {loading ? (
            <>
              <CircularProgress size={20} style={{ marginRight: 8 }} />
              Checking HAProxy Status
            </>
          ) : !node?.haProxy || haProxyOnline === "n/a" ? (
            "No HAProxy"
          ) : (
            haProxyButtonText
          )}
        </Button>
      </Grid>
      {getHaProxyStatusError && (
        <Grid item sm={12}>
          <Alert severity="error">
            <AlertTitle>{"Error fetching HAProxy status"}</AlertTitle>
            {getHaProxyStatusError.message}
          </Alert>
        </Grid>
      )}
    </>
  );
};

export default NodeMonitor;
