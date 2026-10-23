import { Link } from "react-router-dom";

import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Box,
    Chip,
    Button,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
} from "@mui/material";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// Staatuste värvid 
const statusColors = {
    OPEN: "info",
    IN_PROGRESS: "primary",
    WAITING: "warning",
    RESOLVED: "success",    
    CLOSED: "default",
};

// Prioriteetide värvid
const priorityColors = {
    LOW: "success",
    MEDIUM: "info",
    HIGH: "warning",
    CRITICAL: "error",
};

const TicketCard = ({
    ticket,
    user,
    users,
    onAssignTicketToMe,
    onUpdate,
    onDelete,
}) => {

    const canChangeStatus =
        (user.role === "TECHNICIAN" &&
            ticket.assignedTo?.id === user.id) ||
        user.role === "ADMIN";

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 2,
                borderRadius: 2,
                transition: "0.2s",
                "&:hover": {
                    boxShadow: 3,
                },
            }}
        >
            <CardContent>

                {/* Pealkiri ja staatuse tähised */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Box>
                        <Typography
                            variant="h6"
                            component={Link}
                            to={`/tickets/${ticket.id}`}
                            sx={{
                                textDecoration: "none",
                                color: "primary.main",
                                fontWeight: 600,
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            {ticket.title}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Chip
                            label={ticket.status.replaceAll("_", " ")}
                            color={statusColors[ticket.status] || "default"}
                            size="small"
                        />

                        <Chip
                            label={ticket.priority}
                            color={priorityColors[ticket.priority] || "default"}
                            variant="outlined"
                            size="small"
                        />
                    </Stack>
                </Box>

                {/* Pileti kirjeldus */}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2, mb: 2 }}
                >
                    {ticket.description}
                </Typography>

                {/* Vastutav tehnik */}
                <Typography variant="body2">
                    <strong>Assigned to:</strong>{" "}
                    {ticket.assignedTo?.name || "Unassigned"}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Administraatori ja tehniku tegevused */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ mt: 2 }}
                >

                    {/* ADMIN: tehniku määramine */}
                    {user.role === "ADMIN" && (
                        <FormControl
                            size="small"
                            sx={{ minWidth: 180 }}
                        >
                            <InputLabel id={`technician-label-${ticket.id}`}>
                                Assigned to
                            </InputLabel>

                            <Select
                                labelId={`technician-label-${ticket.id}`}
                                value={ticket.assignedTo?.id || ""}
                                label="Assigned to"
                                onChange={(event) =>
                                    onUpdate(ticket.id, {
                                        assignedToId:
                                            event.target.value || null,
                                    })
                                }
                            >
                                <MenuItem value="">
                                    Unassigned
                                </MenuItem>

                                {users
                                    .filter(
                                        (user) =>
                                            user.role === "TECHNICIAN"
                                    )
                                    .map((technician) => (
                                        <MenuItem
                                            key={technician.id}
                                            value={technician.id}
                                        >
                                            {technician.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* ADMIN või määratud TECHNICIAN: staatuse muutmine */}
                    {canChangeStatus && (
                        <FormControl
                            size="small"
                            sx={{ minWidth: 180 }}
                        >
                            <InputLabel id={`status-label-${ticket.id}`}>
                                Status
                            </InputLabel>

                            <Select
                                labelId={`status-label-${ticket.id}`}
                                value={ticket.status}
                                label="Status"
                                onChange={(event) =>
                                    onUpdate(ticket.id, {
                                        status: event.target.value,
                                    })
                                }
                            >
                                <MenuItem value="OPEN">
                                    Open
                                </MenuItem>

                                <MenuItem value="IN_PROGRESS">
                                    In Progress
                                </MenuItem>

                                <MenuItem value="WAITING">
                                    Waiting
                                </MenuItem>

                                <MenuItem value="RESOLVED">
                                    Resolved
                                </MenuItem>

                                <MenuItem value="CLOSED">
                                    Closed
                                </MenuItem>
                            </Select>
                        </FormControl>
                    )}

                </Stack>
            </CardContent>

            {/* Kaardi alumine tegevusriba */}
            <CardActions
                sx={{
                    px: 2,
                    pb: 2,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >

                {/* TECHNICIAN: pileti endale määramine */}
                {user.role === "TECHNICIAN" &&
                    !ticket.assignedTo && ticket.status === 'OPEN' && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AssignmentIndIcon />}
                            onClick={() =>
                                onAssignTicketToMe(ticket.id)
                            }
                        >
                            Assign to me
                        </Button>
                    )}

                {/* Pileti detailvaade */}
                <Button
                    component={Link}
                    to={`/tickets/${ticket.id}`}
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                >
                    View details
                </Button>

                {/* ADMIN: pileti kustutamine */}
                {user.role === "ADMIN" && (
                    <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteOutlinedIcon />}
                        onClick={() =>
                            onDelete(ticket.id)
                        }
                    >
                        Delete
                    </Button>
                )}

            </CardActions>
        </Card>
    );
};

export default TicketCard;