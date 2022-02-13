import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ShoppingCartIcon from "@mui/icons-material/CurrencyExchangeSharp";
import PeopleIcon from "@mui/icons-material/StorageSharp";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/ComputerSharp";
import SettingsIcon from "@mui/icons-material/SettingsSharp";
import LogsIcon from "@mui/icons-material/SubjectSharp";
import { useHistory } from "react-router-dom";

export const Nav = (props: any) => {
  let history = useHistory();
  return (
    <div>
      <Divider />
      <List>
        <div>
          <ListItem button onClick={() => history.push("/chains")}>
            <ListItemIcon>
              <ShoppingCartIcon />
            </ListItemIcon>
            <ListItemText primary="Chains" />
          </ListItem>

          <ListItem button onClick={() => history.push("/hosts")}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Hosts" />
          </ListItem>
          <ListItem button onClick={() => history.push("/oracles")}>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="Oracles" />
          </ListItem>
          <ListItem button onClick={() => history.push("/nodes")}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Nodes" />
          </ListItem>
          <ListItem button onClick={() => history.push("/webhooks")}>
            <ListItemIcon>
              <LogsIcon />
            </ListItemIcon>
            <ListItemText primary="Webhooks" />
          </ListItem>
        </div>
      </List>
      <Divider />
      <List>
        <div>
          <ListItem button onClick={() => history.push("/settings")}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </div>
      </List>
    </div>
  );
};
