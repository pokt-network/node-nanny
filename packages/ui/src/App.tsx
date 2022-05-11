import { useLayoutEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  Box,
  Container,
  CssBaseline,
  Drawer as MUIDrawer,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';

import { Hosts, Logs, Nodes } from './pages';
import { Nav, RootModal, Snackbar } from './components';
import { env } from 'environment';

const drawerWidth: number = 240;

const Drawer = styled(MUIDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
      background: 'linear-gradient(123.23deg, #141C24 11.81%, #262A34 98.51%)',
      borderRadius: '0px 20px 20px 0px',
      border: 'none',
    },
  }),
);

const mdTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C5EC4B',
    },
    secondary: {
      main: '#1D8AED',
    },
    success: {
      main: '#307C0D',
    },
    error: {
      main: '#F93232',
    },
    background: {
      paper: '#192430',
      default: '#192430',
    },
  },
  typography: {
    fontFamily: 'Manrope, sans-serif',
  },
});

function DashboardContent() {
  const [open, setOpen] = useState(true);

  useLayoutEffect(() => {
    const drawerClosed = localStorage.getItem('drawerClosed') === 'true';
    setOpen(!drawerClosed);
  }, []);

  const toggleDrawer = () => {
    localStorage.setItem('drawerClosed', open ? 'true' : 'false');
    setOpen(!open);
  };
  const year = new Date().getFullYear();

  return (
    <ThemeProvider theme={mdTheme}>
      <RootModal />
      <Snackbar />
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          background: 'linear-gradient(106.7deg, #0E1318 16.95%, #111A1F 87.74%)',
        }}
      >
        <CssBaseline />
        <Drawer variant="permanent" open={open} sx={{ overflow: 'hidden' }}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="toggle navigation drawer"
              aria-expanded={!!open}
              onClick={toggleDrawer}
            >
              <MenuIcon sx={{ ...(open && { display: 'none' }) }} />
              <ChevronLeftIcon sx={{ ...(!open && { display: 'none' }) }} />
            </IconButton>
          </Toolbar>
          <Nav open={open} />
          {open && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'end',
                paddingBottom: 6,
                paddingLeft: 2,
                paddingRight: 2,
                height: '100%',
              }}
            >
              <Typography variant="body2">© {year} Pocket Network Inc</Typography>
            </Box>
          )}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Container sx={{ maxWidth: '1800px' }} maxWidth={false}>
            <Box sx={{ mt: 2, mb: 6 }}>
              <Typography
                flex="1"
                component="h1"
                variant="h5"
                noWrap
                sx={{
                  flexGrow: 1,
                  fontWeight: '700',
                }}
              >
                Pocket Node Nanny
              </Typography>
            </Box>
            <Routes>
              <Route path="/" element={<Logs />} />
              <Route path="/hosts" element={<Hosts />} />
              <Route path="/nodes" element={<Nodes />} />
              {env('PNF') && <Route path="/pnf" element={<div>"HEY HI HELLO</div>} />}
            </Routes>
            <Box mb={6} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
