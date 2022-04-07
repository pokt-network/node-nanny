import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PeopleIcon from "@mui/icons-material/StorageSharp";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/ComputerSharp";
import { useHistory } from "react-router-dom";

export const Nav = () => {
  let history = useHistory();
  return (
    <div>
      <Divider />
      <List>
        <div>
          <ListItem button onClick={() => history.push("/logs")}>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="Logs" />
          </ListItem>

          <ListItem button onClick={() => history.push("/hosts")}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Hosts" />
          </ListItem>

          <ListItem button onClick={() => history.push("/nodes")}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Nodes" />
          </ListItem>
        </div>
      </List>
    </div>
  );
};
