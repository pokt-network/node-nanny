import { Dispatch, useEffect, useState } from "react"

import Paper from "components/Paper"
import Title from "components/Title"
import { HostActionsState } from "pages/Hosts"
import HostForm from "./HostForm"
import { HostsTableRow } from "pages/Hosts"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { IHostsQuery, ILocation, useDeleteHostMutation } from "types"
import { ModalHelper } from "utils/modal-helper"
import { ApolloQueryResult } from "@apollo/client"

interface HostInfoProps {
  locations: ILocation[]
  hostNames: string[];
  host: HostsTableRow
  setState: Dispatch<HostActionsState>
  refetch: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>
}


export const HostInfo = ({ host, locations, hostNames, setState, refetch }: HostInfoProps) => {
  const [title, setTitle] = useState("Select Host To View Status")

  const [submitDelete, { error: deleteHostError }] = useDeleteHostMutation({
    onCompleted: () => {
      refetch();
      ModalHelper.close();
    },
  });

  const handleOpenDeleteModal = () => {
    ModalHelper.open({
      modalType: "confirmation",
      modalProps: {
        handleOk: () => submitDelete({ variables: { id: host?.id } }),
        promptText: `Are you sure you wish to remove host ${host?.name} from the inventory database?`,
        okText: "Delete Host",
        okColor: "error",
        cancelColor: "primary",
        error: deleteHostError?.message,
      },
    });
  };

  useEffect(() => {
    setTitle(!host ? "Select Host To View Status" : "Selected Host")
  }, [host])

  return (
    <Paper>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%"
        }}
      >
        <Title>{title}</Title>
        <Box
          sx={{ '& button': { marginLeft: 1 } }}
        >
          <Button
            onClick={() => setState(HostActionsState.Create)}
            size="small"
            variant="contained"
          >
            Create Host
          </Button>
          <Button
            onClick={() => setState(HostActionsState.Upload)}
            size="small"
            variant="outlined"
          >
            Upload CSV
          </Button>
          <Button
            onClick={() => setState(HostActionsState.Location)}
            size="small"
            variant="contained"
          >
            Add Location
          </Button>
        </Box>
      </Box>
      <Box>
        <HostForm
          read
          update
          locations={locations}
          hostNames={hostNames}
          refetchHosts={refetch}
          selectedHost={host}
        />
      </Box>
      {host && (
        <Box
          sx={{ 
            marginTop: 4,
            textAlign: "center",
            '& button': { margin: 1 }
          }}
        >
          <Button
            onClick={() => setState(HostActionsState.Edit)}
            variant="contained"
            color="primary"
          >
            Update Host
          </Button>
          <Button
            onClick={handleOpenDeleteModal}
            variant="outlined"
            color="error"
          >
            Delete Host
          </Button>
        </Box>
      )}
    </Paper>
  )
}

export default HostInfo