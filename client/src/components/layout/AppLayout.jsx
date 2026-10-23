import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserMenu from "./UserMenu";

import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Drawer,
    IconButton,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";

import Sidebar from "./Sidebar";

// Külgmenüü laius
const drawerWidth = 240;

export default function AppLayout() {
    const { user } = useAuth();

    // Mobiilimenüü avatud/suletud olek
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen((prev) => !prev);
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>

            {/* Ülemine navigatsiooniriba */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>

                    {/* Mobiilis nähtav menüünupp */}
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{
                            mr: 2,
                            display: { sm: "none" },
                        }}
                        aria-label="Open navigation menu"
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Rakenduse nimi */}
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            textAlign: "left",
                        }}
                    >
                        IT Service Desk
                    </Typography>

                    <UserMenu />

                    {/* Sisselogitud kasutaja */}
                    {/* <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Typography variant="body2">
                            {user.name}
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{ opacity: 0.8 }}
                        >
                            ({user.role})
                        </Typography>
                    </Box>
 */}
                </Toolbar>
            </AppBar>

            {/* Navigatsioonimenüü */}
            <Box
                component="nav"
                sx={{
                    width: { sm: drawerWidth },
                    flexShrink: { sm: 0 },
                }}
            >

                {/* Mobiilimenüü */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: "block", sm: "none" },

                        "& .MuiDrawer-paper": {
                            width: drawerWidth,
                            boxSizing: "border-box",
                            pt: 9,
                        },
                    }}
                >
                    <Box onClick={() => setMobileOpen(false)}>
                        <Sidebar />
                    </Box>
                </Drawer>

                {/* Arvuti külgmenüü */}
                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: "none", sm: "block" },

                        "& .MuiDrawer-paper": {
                            width: drawerWidth,
                            boxSizing: "border-box",
                            pt: 9,
                            px: 2,
                        },
                    }}
                >
                    <Sidebar />
                </Drawer>

            </Box>

            {/* Lehekülje põhisisu */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    p: 3,
                    mt: 8,
                    bgcolor: "#f5f7fa",
                }}
            >
                <Outlet />
            </Box>

        </Box>
    );
}