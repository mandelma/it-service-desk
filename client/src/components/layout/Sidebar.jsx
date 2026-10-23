import { NavLink } from "react-router-dom";

import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
} from "@mui/material";

import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

export default function Sidebar() {
    return (
        <Box>
            <Typography
                variant="overline"
                sx={{
                    px: 2,
                    color: "text.secondary",
                }}
            >
                Navigation
            </Typography>

            <Divider sx={{ my: 1 }} />

            <List>
                <ListItemButton
                    component={NavLink}
                    to="/tickets"
                    sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        "&.active": {
                            bgcolor: "action.selected",
                            color: "primary.main",
                        },
                    }}
                >
                    <ListItemIcon>
                        <ConfirmationNumberOutlinedIcon />
                    </ListItemIcon>

                    <ListItemText primary="Tickets" />
                </ListItemButton>
            </List>
        </Box>
    );
}