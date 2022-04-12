import { ApolloQueryResult } from "@apollo/client";
import { Button, Paper, Typography } from "@mui/material";

import { IHost, IHostsQuery, ILocation, useDeleteHostMutation } from "types";
import { ModalHelper } from "utils";

interface IHostStatusProps {
  selectedHost: IHost | undefined;
  locations: ILocation[];
  hostNames: string[];
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
}

export function HostStatus({
  selectedHost,
  locations,
  hostNames,
  refetchHosts,
}: IHostStatusProps) {
  const { fqdn, ip, loadBalancer, location, name } = selectedHost || {
    fqdn: "",
    ip: "",
    loadBalancer: false,
    location: null,
    name: "",
  };

  const [submitDelete] = useDeleteHostMutation({
    onCompleted: () => {
      refetchHosts();
      ModalHelper.close();
    },
  });

  const handleOpenUpdateHostModal = () => {
    ModalHelper.open({
      modalType: "hostsForm",
      modalProps: {
        update: true,
        selectedHost,
        locations,
        hostNames,
        refetchHosts,
      },
    });
  };

  const handleOpenDeleteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => submitDelete({ variables: { id: selectedHost.id } }),
        promptText: `Are you sure you wish to delete Host ${selectedHost?.name}?`,
      },
    });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Paper style={{ width: 434, padding: 10 }} variant="outlined">
          <Typography align="center" variant="h6" gutterBottom>
            {!selectedHost ? "Select Host to view Status" : "Selected Host"}
          </Typography>
          <Paper style={{ padding: 10 }} variant="outlined">
            <Typography>Name: {name}</Typography>
            {(fqdn || ip) && (
              <Typography>{`${fqdn ? "FQDN" : "IP"}: ${fqdn || ip}`}</Typography>
            )}
            <Typography>Load Balancer: {String(loadBalancer)}</Typography>
            <Typography>Location: {location?.name}</Typography>
          </Paper>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Button
              onClick={handleOpenUpdateHostModal}
              disabled={!selectedHost}
              variant="contained"
            >
              Update Host
            </Button>
            <Button
              onClick={handleOpenDeleteModal}
              disabled={!selectedHost}
              variant="contained"
              color="error"
            >
              Delete Host
            </Button>
          </div>
        </Paper>
      </div>
    </>
  );
}
