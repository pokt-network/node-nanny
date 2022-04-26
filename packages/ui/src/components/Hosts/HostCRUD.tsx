import { Dispatch, useEffect, useState } from "react"

import Paper from "components/Paper"
import Title from "components/Title"
import { HostActionsState } from "pages/Hosts"
import HostForm from "./HostForm"
import { IHost, IHostsQuery, ILocation } from "types"

import Box from "@mui/material/Box"
import { ApolloQueryResult } from "@apollo/client"

interface HostCRUDProps {
  locations: ILocation[]
  hostNames: string[];
  host: IHost
  type: HostActionsState
  setState: Dispatch<HostActionsState>
  refetch: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>
}

export const HostCRUD = ({ host, locations, hostNames, type, setState, refetch }: HostCRUDProps) => {
  const [title, setTitle] = useState("Select Host To View Status")

  useEffect(() => {
    if(host) {
      if(type === "info") {
        setTitle("Selected Host")
      }
      if(type === "edit") {
        setTitle("Edit Host")
      }
      if(type === "create") {
        setTitle("Create Host")
      }
    } else {
      setTitle("Select Host To View Status")
    }
  }, [host, type])

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
        <Title>{title}</Title>
      </Box>
      <Box>
        <HostForm
          read={type === "info"}
          update={type === "info" || type === "edit"}
          locations={locations}
          hostNames={hostNames}
          refetchHosts={refetch}
          selectedHost={type !== "create" ? host : null}
          onCancel={() => setState(HostActionsState.Info)}
          setState={setState}
        />
      </Box>
    </Paper>
  )
}

export default HostCRUD