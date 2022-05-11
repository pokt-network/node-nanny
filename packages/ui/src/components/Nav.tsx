import { useLocation, useNavigate } from 'react-router-dom';
import {
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/StorageSharp';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/ComputerSharp';

const data = [
  {
    label: 'Logs',
    to: '/',
    icon: BarChartIcon,
  },
  {
    label: 'Hosts',
    to: '/hosts',
    icon: PeopleIcon,
  },
  {
    label: 'Nodes',
    to: '/nodes',
    icon: LayersIcon,
  },
];

interface NavProps {
  open: boolean;
}

export const Nav = ({ open }: NavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <List>
      {data?.map((navItem) => (
        <Tooltip title={!open ? navItem.label : ''} placement="right">
          <ListItemButton
            key={navItem.label}
            component={Link}
            href={navItem.to}
            color="inherit"
            onClick={() => navigate(navItem.to)}
            selected={navItem.to === location.pathname}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#2E3643',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon>
              <navItem.icon />
            </ListItemIcon>
            <ListItemText primary={navItem.label} />
          </ListItemButton>
        </Tooltip>
      ))}
    </List>
  );
};
