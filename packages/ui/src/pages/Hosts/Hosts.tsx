import { useState } from "react";
import { Button } from "@mui/material";

import { Table } from "components";
import { IHost, useLocationsQuery, useHostsQuery } from "types";
import { ModalHelper } from "utils";

import { HostStatus } from "./HostStatus";

export function Hosts() {
  const [selectedHost, setSelectedHost] = useState<IHost>(undefined);

  const { data, error, loading, refetch } = useHostsQuery();
  const {
    data: locationsData,
    error: locationsError,
    loading: locationsLoading,
  } = useLocationsQuery();

  const handleOpenCreateHostModal = () => {
    ModalHelper.open({
      modalType: "hostsForm",
      modalProps: { refetchHosts: refetch, locations: locationsData?.locations },
    });
  };

  const handleOpenUploadNodeCSVModal = () => {
    ModalHelper.open({
      modalType: "hostsCsv",
      modalProps: { refetchNodes: refetch, locations: locationsData?.locations },
    });
  };

  if (loading || locationsLoading) return <>Loading...</>;
  if (error || locationsError) return <>Error! ${(error || locationsError)?.message}</>;

  if (data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            width: "60%",
            marginBottom: "16px",
          }}
        >
          {/* <div style={{ width: "100%", marginBottom: 32 }}> */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            <Button onClick={handleOpenCreateHostModal} variant="outlined">
              Create Host
            </Button>
            <Button onClick={handleOpenUploadNodeCSVModal} variant="outlined">
              Upload CSV
            </Button>
          </div>
          <HostStatus
            selectedHost={selectedHost}
            locations={locationsData?.locations}
            refetchHosts={refetch}
          />
          {/* </div> */}
        </div>
        <Table
          type="Hosts"
          searchable
          paginate
          rows={data.hosts}
          mapDisplay={(host) => ({ ...host, location: host.location.name })}
          selectedRow={selectedHost?.id}
          onSelectRow={setSelectedHost}
        />
      </div>
    );
  }

  return <></>;
}
