import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    getTicketById,
    updateTicket,
    assignTicketToMe,
    getTicketComments,
    createTicketComment
} from "../api/ticketApi.js";

import { useAuth } from "../context/AuthContext.jsx";

import {
    Box,
    Typography,
    Button,
    Divider,
    Chip,
    Stack,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    TextField
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const TicketDetailPage = () => {
    const { id } = useParams();

    const { user } = useAuth();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusError, setStatusError] = useState(null);

    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState(null);

    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState(null);

    const [newComment, setNewComment] = useState("");
    const [sendingComment, setSendingComment] = useState(false);
    const [commentSubmitError, setCommentSubmitError] = useState(null);

    const canManageTicket =
        user?.role === "ADMIN" ||
        (
            user?.role === "TECHNICIAN" &&
            ticket?.assignedToId === user.id
        );

    const canAssignToMe =
        user?.role === "TECHNICIAN" &&
        ticket?.assignedToId === null &&
        ticket?.status === "OPEN";


    console.log("USER ROLE:", user?.role);
    console.log("CAN MANAGE TICKET:", canManageTicket);

    useEffect(() => {
        const loadTicket = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Laadime pileti
                const data = await getTicketById(id);
                setTicket(data);

                // 2. Laadime kommentaarid
                setCommentsLoading(true);
                setCommentsError(null);
                setComments([]);

                try {
                    const commentsData = await getTicketComments(id);
                    setComments(commentsData);

                } catch (error) {
                    console.error("GET COMMENTS ERROR:", error);

                    setCommentsError("Failed to load comments");

                } finally {
                    setCommentsLoading(false);
                }

            } catch (error) {
                console.error("GET TICKET ERROR:", error.message);

                setError(
                    error.response?.status === 404
                        ? "Ticket not found"
                        : "Failed to load ticket"
                );

            } finally {
                setLoading(false);
            }
        };

        loadTicket();
    }, [id]);

    const handleStatusChange = async (event) => {
        const newStatus = event.target.value;

        if (updatingStatus || newStatus === ticket.status) {
            return;
        }

        setUpdatingStatus(true);
        setStatusError(null);

        try {
            const updatedTicket = await updateTicket(ticket.id, {
                status: newStatus,
            });

            setTicket(updatedTicket);

        } catch (error) {
            console.error("UPDATE STATUS ERROR:", error);

            setStatusError(
                error.response?.data?.message ||
                "Failed to update ticket status"
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAssignToMe = async () => {
        if (assigning || !canAssignToMe) {
            return;
        }

        setAssigning(true);
        setAssignError(null);

        try {
            const updatedTicket = await assignTicketToMe(ticket.id);

            setTicket(updatedTicket);

        } catch (error) {
            console.error("ASSIGN TO ME ERROR:", error);

            setAssignError(
                error.response?.data?.message ||
                "Failed to assign ticket"
            );

        } finally {
            setAssigning(false);
        }
    };

    const handleAddComment = async () => {
        const content = newComment.trim();

        if (!content || sendingComment) {
            return;
        }

        try {
            setSendingComment(true);
            setCommentSubmitError(null);

            const createdComment = await createTicketComment(id, content);

            // Lisame uue kommentaari kohe olemasolevasse nimekirja
            setComments((prevComments) => [
                ...prevComments,
                createdComment
            ]);

            // Tühjendame tekstivälja
            setNewComment("");

        } catch (error) {
            console.error("CREATE COMMENT ERROR:", error);

            setCommentSubmitError(
                error.response?.data?.message || "Failed to add comment"
            );

        } finally {
            setSendingComment(false);
        }
    };

    const statusColors = {
        OPEN: "info",
        IN_PROGRESS: "primary",
        WAITING: "warning",
        RESOLVED: "success",
        CLOSED: "default",
    };

    const priorityColors = {
        LOW: "success",
        MEDIUM: "info",
        HIGH: "warning",
        CRITICAL: "error",
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <Link to="/tickets">
                    ← Back to tickets
                </Link>
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    console.log("TICKET COMMENTS:", comments);alignItems:

    return (
        <Box sx={{ textAlign: "left" }}>

            {/* Tagasi piletite loendisse */}
            <Button
                component={Link}
                to="/tickets"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 3 }}
            >
                Back to tickets
            </Button>

            {/* Lehe päis */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 600 }}
                >
                    {ticket.title}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    Ticket details
                </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Olemasolev pileti info */}
            
            {/* Pileti andmed */}
            <Stack spacing={3}>

                {/* Esimene kaart */}
                <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>

                        {statusError && (
                            <Alert
                                severity="error"
                                onClose={() => setStatusError(null)}
                                sx={{ mb: 2 }}
                            >
                                {statusError}
                            </Alert>
                        )}

                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Ticket information
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Description
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                mb: 3,
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {ticket.description}
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                                mt: 3,
                                mb: 3,
                                flexWrap: "wrap",
                            }}
                            useFlexGap
                        >
                            {canManageTicket ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <FormControl size="small" sx={{ minWidth: 180 }}>
                                        <InputLabel id="ticket-status-label">
                                            Status
                                        </InputLabel>

                                        <Select
                                            labelId="ticket-status-label"
                                            value={ticket.status}
                                            label="Status"
                                            onChange={handleStatusChange}
                                            disabled={updatingStatus}
                                        >
                                            <MenuItem value="OPEN">Open</MenuItem>
                                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                            <MenuItem value="WAITING">Waiting</MenuItem>
                                            <MenuItem value="RESOLVED">Resolved</MenuItem>
                                            <MenuItem value="CLOSED">Closed</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {updatingStatus && (
                                        <CircularProgress size={20} />
                                    )}
                                </Box>
                            ) : (
                                <Chip
                                    label={`Status: ${ticket.status.replaceAll("_", " ")}`}
                                    color={statusColors[ticket.status] || "default"}
                                    variant="filled"
                                />
                            )}

                            <Chip
                                label={`Priority: ${ticket.priority}`}
                                color={priorityColors[ticket.priority] || "default"}
                                variant="outlined"
                            />
                        </Stack>

                    </CardContent>
                </Card>

                {/* Teine kaart */}
                <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>

                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Additional information
                        </Typography>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, 1fr)",
                                },
                                gap: 3,
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Created by
                                </Typography>

                                <Typography variant="body1">
                                    {ticket.createdBy?.name || "Unknown"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Assigned to
                                </Typography>

                                <Typography variant="body1">
                                    {ticket.assignedTo?.name || "Unassigned"}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Created at
                                </Typography>

                                <Typography variant="body1">
                                    {ticket.createdAt
                                        ? new Date(ticket.createdAt).toLocaleString("fi-FI")
                                        : "Unknown"}
                                </Typography>
                            </Box>
                        </Box>
                        {assignError && (
                            <Alert
                                severity="error"
                                sx={{ mt: 2 }}
                                onClose={() => setAssignError(null)}
                            >
                                {assignError}
                            </Alert>
                        )}

                        {canAssignToMe && (
                            <Button
                                variant="contained"
                                size="small"
                                sx={{ mt: 3 }}
                                onClick={handleAssignToMe}
                                disabled={assigning}
                            >
                                {assigning ? "Assigning..." : "Assign to me"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Comments
                        </Typography>

                        {commentsLoading && (
                            <CircularProgress size={24} />
                        )}

                        {commentsError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {commentsError}
                            </Alert>
                        )}

                        {!commentsLoading && !commentsError && comments.length === 0 && (
                            <Typography color="text.secondary">
                                No comments yet.
                            </Typography>
                        )}

                        {!commentsLoading && comments.map((comment) => (
                            <Box key={comment.id} sx={{ mb: 2 }}>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{
                                        alignItems: "center",
                                        mb: 1,
                                    }}
                                >
                                    <Typography variant="subtitle2">
                                        {comment.author?.name || "Unknown user"}
                                    </Typography>

                                    <Chip
                                        label={comment.author?.role || "USER"}
                                        size="small"
                                        variant="outlined"
                                    />

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </Typography>
                                </Stack>

                                <Typography
                                    variant="body2"
                                    sx={{ whiteSpace: "pre-wrap" }}
                                >
                                    {comment.content}
                                </Typography>

                                <Divider sx={{ mt: 2 }} />
                            </Box>
                        ))}
                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Add a comment
                        </Typography>

                        {commentSubmitError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {commentSubmitError}
                            </Alert>
                        )}

                        <TextField
                            label="Write a comment"
                            multiline
                            minRows={3}
                            fullWidth
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            disabled={sendingComment}
                            slotProps={{
                                htmlInput: {
                                    maxLength: 2000
                                }
                            }}
                            sx={{ mb: 2 }}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            {sendingComment && (
                                <CircularProgress size={22} />
                            )}

                            <Button
                                variant="contained"
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || sendingComment}
                            >
                                {sendingComment ? "Sending..." : "Add Comment"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

            </Stack>
            

        </Box>
    );
}

export default TicketDetailPage;