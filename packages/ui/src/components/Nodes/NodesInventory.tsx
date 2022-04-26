import { Dispatch } from "react"

import Paper from "components/Paper"
import Title from "components/Title"
import { INode } from "types"
import { NodeActionsState } from "pages/Nodes"

import Typography from "@mui/material/Typography"
import Grid from "@mui/material/Grid"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"

interface NodesInventoryProps {
    nodes: INode[]
    setState: Dispatch<NodeActionsState>
}

export const NodesInventory = ({ nodes, setState }: NodesInventoryProps) => {
    const nodesTotal = nodes.length
    const healthyTotal = nodes.filter(({ status }) => status === "OK").length
    const errorTotal = nodes.filter(({ status }) => status === "ERROR").length
    const mutedTotal = nodes.filter(({ muted }) => muted).length

    return (
        <Paper>
            <Grid 
                container 
                spacing={2} 
                alignItems="center"
                sx={{
                    "& h3": {
                        margin: 0
                    }
                }}
            >    
                <Grid item sm={12} md={4} lg={2}>
                    <Title>Nodes Inventory</Title>
                </Grid>
                <Grid item sm={12} md>
                    <Grid container spacing={2} columns={{ xs: 12, md: 3}}>
                        <Grid item>
                            <Typography>{nodesTotal} Nodes</Typography>
                        </Grid>
                        <Grid item>
                            <Typography>
                                {healthyTotal} Healthy
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography>{errorTotal} Error</Typography>
                        </Grid>
                        <Grid item>
                            <Typography>{mutedTotal} Muted</Typography>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item sm={12} md="auto"
                    sx={{ '& button': { marginLeft: 1 } }}
                    >
                    <Button
                        onClick={() => setState(NodeActionsState.Create)}
                        size="small"
                        variant="contained"
                    >
                        Create Node
                    </Button>
                    <Button
                        onClick={() => setState(NodeActionsState.Upload)}
                        size="small"
                        variant="outlined"
                    >
                        Upload CSV
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    )
}

export default NodesInventory