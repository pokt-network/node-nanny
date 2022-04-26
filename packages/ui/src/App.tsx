import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import { Route, Routes } from "react-router-dom";
import { Home, Hosts, Logs, Nodes } from "./pages";
import { Nav, RootModal } from "./components";

const drawerWidth: number = 240;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    "& .MuiDrawer-paper": {
      position: "relative",
      whiteSpace: "nowrap",
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: "border-box",
      ...(!open && {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up("sm")]: {
          width: theme.spacing(9),
        },
      }),
      background: "linear-gradient(123.23deg, #141C24 11.81%, #262A34 98.51%)",
      borderRadius: "0px 20px 20px 0px",
      border: "none",
    },
  }),
);

const mdTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#C5EC4B",
    },
    secondary: {
      main: "#1D8AED",
    },
    success: {
      main: "#307C0D",
    },
    error: {
      main: "#F93232",
    },
    background: {
      paper: "#192430",
      default: "#192430",
    },
  },
  typography: {
    fontFamily: "Manrope, sans-serif",
  },
});

function DashboardContent() {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };
  const year = new Date().getFullYear();

  return (
    <ThemeProvider theme={mdTheme}>
      <RootModal />
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          background: "linear-gradient(106.7deg, #0E1318 16.95%, #111A1F 87.74%)",
        }}
      >
        <CssBaseline />
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
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
              <MenuIcon
                sx={{
                  ...(open && { display: "none" }),
                }}
              />
              <ChevronLeftIcon
                sx={{
                  ...(!open && { display: "none" }),
                }}
              />
            </IconButton>
          </Toolbar>
          <Nav />
          {open && (
            <Box
              sx={{
                display: "flex",
                alignItems: "end",
                paddingBottom: 6,
                paddingLeft: 2,
                paddingRight: 2,
                height: "100%",
              }}
            >
              <Typography variant="body2">© {year} Pocket Network Inc</Typography>
            </Box>
          )}
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: "auto",
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ mt: 2, mb: 6 }}>
              <Typography
                flex="1"
                component="h1"
                variant="h5"
                noWrap
                sx={{
                  flexGrow: 1,
                  fontWeight: "700",
                }}
              >
                Pocket Node Nanny
              </Typography>
            </Box>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/nodes" element={<Nodes />} />
              <Route path="/hosts" element={<Hosts />} />
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
