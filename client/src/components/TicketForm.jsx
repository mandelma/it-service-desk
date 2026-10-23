import { useState, useEffect } from "react";

import {
    Paper,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Alert,
    Stack,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

const TicketForm = ({ onCreate, onLoadingChange, onSuccess }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!error) return;

        const timer = setTimeout(() => {
            setError(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [error]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        console.log("SUBMIT KÄIVITUS:", Date.now());

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        if (!description.trim()) {
            setError("Description is required");
            return;
        }

        setError(null);
        setLoading(true);
        onLoadingChange?.(true);

        try {
            const ticketData = {
                title: title.trim(),
                description: description.trim(),
                priority,
            };

            const result = await onCreate(ticketData);

            if (result.success) {
               onSuccess?.();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError(
                error.message || "Failed to create ticket"
            );
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                borderRadius: 2,
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 600,
                    mb: 1,
                }}
            >
                Create new ticket
            </Typography>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
            >
                Describe your IT support request
            </Typography>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            <Box
                component="form"
                onSubmit={handleSubmit}
            >
                <Stack spacing={3}>

                    {/* Pealkiri */}
                    <TextField
                        id="title"
                        label="Title"
                        placeholder="Briefly describe the issue"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                        required
                        fullWidth
                        disabled={loading}
                    />

                    {/* Kirjeldus */}
                    <TextField
                        id="description"
                        label="Description"
                        placeholder="Describe the problem in detail..."
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        multiline
                        rows={4}
                        required
                        fullWidth
                        disabled={loading}
                    />

                    {/* Prioriteet */}
                    <FormControl
                        fullWidth
                        disabled={loading}
                    >
                        <InputLabel id="ticket-priority-label">
                            Priority
                        </InputLabel>

                        <Select
                            labelId="ticket-priority-label"
                            id="priority"
                            value={priority}
                            label="Priority"
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                        >
                            <MenuItem value="LOW">
                                Low
                            </MenuItem>

                            <MenuItem value="MEDIUM">
                                Medium
                            </MenuItem>

                            <MenuItem value="HIGH">
                                High
                            </MenuItem>

                            <MenuItem value="CRITICAL">
                                Critical
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {/* Salvestamise nupp */}
                    <Box>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<AddIcon />}
                            disabled={loading}
                        >
                            {loading
                                ? "Creating ticket..."
                                : "Create ticket"}
                        </Button>
                    </Box>

                </Stack>
            </Box>
        </Paper>
    );
};

export default TicketForm;