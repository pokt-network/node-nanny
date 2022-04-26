import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PeopleIcon from "@mui/icons-material/StorageSharp";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/ComputerSharp";
import { useLocation } from "react-router-dom";

const data = [
  {
    label: "Logs",
    to: "/logs",
    icon: BarChartIcon,
  },
  {
    label: "Nodes",
    to: "/nodes",
    icon: LayersIcon,
  },
  {
    label: "Hosts",
    to: "/hosts",
    icon: PeopleIcon,
  },
];

export const Nav = () => {
  const location = useLocation();
  return (
    <List>
      {data &&
        data.map((navItem) => (
          <ListItemButton
            key={navItem.label}
            component={Link}
            href={navItem.to}
            color="inherit"
            selected={navItem.to === location.pathname}
            sx={{
              "&.Mui-selected": {
                backgroundColor: "#2E3643",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            <ListItemIcon>
              <navItem.icon />
            </ListItemIcon>
            <ListItemText primary={navItem.label} />
          </ListItemButton>
        ))}
    </List>
  );
};
