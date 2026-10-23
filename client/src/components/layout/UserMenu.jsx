import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
    Avatar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";

export default function UserMenu() {
    const { user, logout } = useAuth();

    // Element, mille juures rippmenüü avatakse
    const [anchorEl, setAnchorEl] = useState(null);

    // Kas menüü on avatud?
    const open = Boolean(anchorEl);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
    };

    return (
        <>
            {/* Kasutaja andmed ja avatar */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                {/* Kasutaja nimi ja roll */}
                <Box
                    sx={{
                        display: { xs: "none", sm: "block" },
                        textAlign: "right",
                    }}
                >
                    <Typography variant="body2">
                        {user?.name || user?.email || "User"}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{ opacity: 0.8 }}
                    >
                        {user?.role}
                    </Typography>
                </Box>

                {/* Kasutaja avatar */}
                <Tooltip title="Account menu">
                    <IconButton
                        onClick={handleOpen}
                        size="small"
                        aria-label="Open account menu"
                        aria-controls={
                            open ? "account-menu" : undefined
                        }
                        aria-haspopup="true"
                        aria-expanded={
                            open ? "true" : undefined
                        }
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "secondary.main",
                            }}
                        >
                            {(user?.name || user?.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Avatav kasutajamenüü */}
            <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText primary="Logout" />
                </MenuItem>
            </Menu>
        </>
    );
}