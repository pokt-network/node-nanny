import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PeopleIcon from "@mui/icons-material/StorageSharp";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/ComputerSharp";
import { useNavigate } from "react-router-dom";

export const Nav = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Divider />
      <List>
        <div>
          <ListItem button onClick={() => navigate("/logs")}>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="Logs" />
          </ListItem>

          <ListItem button onClick={() => navigate("/hosts")}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Hosts" />
          </ListItem>

          <ListItem button onClick={() => navigate("/nodes")}>
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
