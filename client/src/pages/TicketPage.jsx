import { useEffect, useState, useRef } from "react";
import { getTickets, createTicket, updateTicket, assignTicketToMe, deleteTicket } from "../api/ticketApi.js";
import { getUsers } from "../api/userApi.js";
import { useAuth } from "../context/AuthContext.jsx";


import TicketCard from "../components/TicketCard.jsx";
import TicketForm from "../components/TicketForm.jsx";

import {
    Box,
    Typography,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";

function TicketPage() {
    const [tickets, setTickets] = useState([]);
    const [ users, setUsers ] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("newest");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const [isCreatingTicket, setIsCreatingTicket] = useState(false);

    const newTicketButtonRef = useRef(null);

    /* const [ title, setTitle ] = useState("");
    const [ description, setDescription ] = useState("");
    const [ status, setStatus ] = useState("open");
    const [ priority, setPriority ] = useState("MEDIUM"); */

    const { token, user } = useAuth();

    useEffect(() => {
        if (user?.role !== "ADMIN") {
            return;
        }

        const loadUsers = async () => {
            try {
                const data = await getUsers(token);
                setUsers(data);
            } catch (error) {
                console.error("USER ERROR:", error.message);
            }
        };

        loadUsers();
    }, [token, user]);

    /* useEffect(() => {
        console.log("USERS CHANGED:", users);
    }, [users]); */


    useEffect(() => {
        const loadTickets = async () => {
            try {
                const data = await getTickets();
                setTickets(data);
            } catch (error) {
                console.error("TICKET ERROR:", error.message);
            }
        };

        loadTickets();
    }, [token]);

    useEffect(() => {
        console.log("IS CREATING TICKET:", isCreatingTicket);
    }, [isCreatingTicket]);

    const handleCreateTicket = async (ticketData) => {
        try {
            const newTicket = await createTicket(ticketData);

            console.log("TICKET CREATED:", newTicket);

            setTickets((currentTickets) => [
                newTicket,
                ...currentTickets
            ]);

            // setCreateDialogOpen(false);

            return {
                success: true
            };
        } catch (error) {
            console.error(
                "CREATE TICKET ERROR:",
                error.message
            );

            const responseData = error.response?.data;

            const message =
                responseData?.errors
                    ?.map((error) => error.message)
                    .join(". ") ||
                responseData?.message ||
                "Failed to create ticket";

            return {
                success: false,
                message
            };
        }
    };

    const handleUpdateTicket = async (ticketId, updatedData) => {
        try {
            const updatedTicket = await updateTicket(ticketId, updatedData);
            setTickets((currentTickets) => currentTickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)));
        } catch (error) {
            console.error("UPDATE TICKET ERROR:", error.message);
        }
    };

    const handleAssignTicketToMe = async (ticketId) => {
        try {
            const updatedTicket = await assignTicketToMe(ticketId);  
            setTickets((currentTickets) => currentTickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)));
        } catch (error) {
            console.error("ASSIGN TICKET TO ME ERROR:", error.message);
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        try {
            await deleteTicket(ticketId);
            setTickets((currentTickets) => currentTickets.filter((ticket) => ticket.id !== ticketId));
        } catch (error) {
            console.error("DELETE TICKET ERROR:", error.message);
        }
    };

    const filteredTickets = tickets.filter((ticket) => {
        const search = searchTerm.toLowerCase().trim();

        const title = ticket.title.toLowerCase();
        const description = (ticket.description || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            description.includes(search);

        const matchesStatus =
            statusFilter === "ALL" ||
            ticket.status === statusFilter;

        const matchesPriority =
            priorityFilter === "ALL" ||
            ticket.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const priorityOrder = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4,
    };

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        // Kõrgema prioriteediga piletid eespool
        if (sortOrder === "priority-high") {
            return (
                priorityOrder[b.priority] -
                priorityOrder[a.priority]
            );
        }

        // Madalama prioriteediga piletid eespool
        if (sortOrder === "priority-low") {
            return (
                priorityOrder[a.priority] -
                priorityOrder[b.priority]
            );
        }

        // Kuupäeva järgi sorteerimine
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        if (sortOrder === "newest") {
            return dateB - dateA;
        }

        return dateA - dateB;
    });

    const handleClearFilters = () => {
        setSearchTerm("");
        setStatusFilter("ALL");
        setPriorityFilter("ALL");
        setSortOrder("newest");
    };

    const hasActiveFilters =
        searchTerm !== "" ||
        statusFilter !== "ALL" ||
        priorityFilter !== "ALL" ||
        sortOrder !== "newest";


    const handleOpenCreateDialog = () => {
        setCreateDialogOpen(true);
    };

    const handleCloseCreateDialog = () => {
        if (isCreatingTicket) {
            return;
        }

        setCreateDialogOpen(false);
    };

    return (
        <Box>

            {/* Lehe päis */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 600 }}
                >
                    Tickets
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    Manage and track IT support requests
                </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Uue pileti loomine */}
            <Box sx={{ mb: 3 }}>
                <Button
                    ref={newTicketButtonRef}
                    variant="contained"
                    onClick={handleOpenCreateDialog}
                >
                    + New ticket
                </Button>
            </Box>
           
            <Dialog
                open={createDialogOpen}
                onClose={handleCloseCreateDialog}
                
                fullWidth
                maxWidth="sm"
            >
                <DialogContent sx={{ pt: 3 }}>
                    {createDialogOpen && (
                        <TicketForm 
                            onCreate={handleCreateTicket} 
                            onLoadingChange={setIsCreatingTicket}
                            onSuccess={() => {
                                setCreateDialogOpen(false);

                                setTimeout(() => {
                                    newTicketButtonRef.current?.blur();
                                }, 0);
                            }}
                        />
                    )}
                </DialogContent>

                <DialogActions>
                    <Button 
                        onClick={handleCloseCreateDialog}
                        disabled={isCreatingTicket}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ mt: 4, mb: 3 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    useFlexGap
                    sx={{
                        flexWrap: "wrap",
                        alignItems: {
                            xs: "stretch",
                            md: "center"
                        }
                    }}
                >
                    <TextField
                        label="Search tickets"
                        placeholder="Search by title or description..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />

                    <FormControl
                        size="small"
                        sx={{ minWidth: { md: 180 } }}
                    >
                        <InputLabel id="status-filter-label">
                            Status
                        </InputLabel>

                        <Select
                            labelId="status-filter-label"
                            value={statusFilter}
                            label="Status"
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                        >
                            <MenuItem value="ALL">All statuses</MenuItem>
                            <MenuItem value="OPEN">Open</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                            <MenuItem value="WAITING">Waiting</MenuItem>
                            <MenuItem value="RESOLVED">Resolved</MenuItem>
                            <MenuItem value="CLOSED">Closed</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl
                        size="small"
                        sx={{ minWidth: { md: 180 } }}
                    >
                        <InputLabel id="priority-filter-label">
                            Priority
                        </InputLabel>

                        <Select
                            labelId="priority-filter-label"
                            value={priorityFilter}
                            label="Priority"
                            onChange={(event) =>
                                setPriorityFilter(event.target.value)
                            }
                        >
                            <MenuItem value="ALL">All priorities</MenuItem>
                            <MenuItem value="LOW">Low</MenuItem>
                            <MenuItem value="MEDIUM">Medium</MenuItem>
                            <MenuItem value="HIGH">High</MenuItem>
                            <MenuItem value="CRITICAL">Critical</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl
                        size="small"
                        sx={{ minWidth: { md: 180 } }}
                    >
                        <InputLabel id="sort-order-label">
                            Sort by
                        </InputLabel>

                        <Select
                            labelId="sort-order-label"
                            value={sortOrder}
                            label="Sort by"
                            onChange={(event) =>
                                setSortOrder(event.target.value)
                            }
                        >
                            <MenuItem value="newest">
                                Newest first
                            </MenuItem>

                            <MenuItem value="oldest">
                                Oldest first
                            </MenuItem>

                            <MenuItem value="priority-high">
                                Highest priority first
                            </MenuItem>

                            <MenuItem value="priority-low">
                                Lowest priority first
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                        sx={{
                            whiteSpace: "nowrap",
                            height: 40,
                        }}
                    >
                        Clear filters
                    </Button>
                </Stack>
            </Box>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
            >
                Showing {sortedTickets.length} of {tickets.length} tickets
            </Typography>

            {/* Piletite loend */}
            <Box sx={{ mt: 4 }}>
                {filteredTickets.length === 0 ? (
                    <Typography color="text.secondary">
                        No tickets found.
                    </Typography>
                ) : (
                    sortedTickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            user={user}
                            users={users}
                            onDelete={handleDeleteTicket}
                            onAssignTicketToMe={handleAssignTicketToMe}
                            onUpdate={handleUpdateTicket}
                        />
                    ))
                )}
            </Box>

        </Box>
    );
}

export default TicketPage;