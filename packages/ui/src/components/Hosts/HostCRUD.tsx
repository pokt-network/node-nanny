import { Dispatch } from "react"

import Paper from "components/Paper"
import Title from "components/Title"
import { HostActionsState } from "pages/Hosts"
import HostForm from "./HostForm"
import { HostsTableRow } from "pages/Hosts"

import Box from "@mui/material/Box"
import { IHostsQuery, ILocation } from "types"
import { ApolloQueryResult } from "@apollo/client"

interface HostCRUDProps {
  locations: ILocation[]
  hostNames: string[];
  host: HostsTableRow
  type: "create" | "edit"
  setState: Dispatch<HostActionsState>
  refetch: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>
}

export const HostCRUD = ({ host, locations, hostNames, type, setState, refetch }: HostCRUDProps) => {

  const handleCancel = () => {
    setState(HostActionsState.Info)
  }

  return (
    <Paper>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          '& h3': {
            textTransform: "capitalize"
          }
        }}
      >
        <Title>{`${type} Host`}</Title>
      </Box>
      <Box>
        <HostForm
          update={type === "edit"}
          locations={locations}
          hostNames={hostNames}
          refetchHosts={refetch}
          selectedHost={type === "edit" ? host : null}
          onCancel={handleCancel}
        />
      </Box>
    </Paper>
  )
}

export default HostCRUD