import { useEffect, useState } from "react";
import { getTickets, createTicket, updateTicket, assignTicketToMe } from "../api/ticketApi.js";
import { useAuth } from "../context/AuthContext.jsx";

function TicketPage() {
    const [tickets, setTickets] = useState([]);

    const [ title, setTitle ] = useState("");
    const [ description, setDescription ] = useState("");
    const [ status, setStatus ] = useState("open");
    const [ priority, setPriority ] = useState("MEDIUM");

    const { token, user, setUser, setToken } = useAuth();

    useEffect(() => {
        const loadTickets = async () => {
            try {
                const data = await getTickets(token);
                setTickets(data);
            } catch (error) {
                console.error("TICKET ERROR:", error.message);
            }
        };

        loadTickets();
    }, [token]);

    const handleCreateTicket = async (event) => {
        event.preventDefault();

        const ticketData = {
            title,
            description,
            priority,
        };

        try {
            const newTicket = await createTicket(ticketData, token);

            setTickets((currentTickets) => [
                newTicket,
                ...currentTickets
            ]);

            setTitle("");
            setDescription("");
            setPriority("MEDIUM");
        } catch (error) {
            console.error("CREATE TICKET ERROR:", error.message);
        }
    };

    const handleUpdateTicket = async (ticketId, updatedData) => {
        try {
            const updatedTicket = await updateTicket(ticketId, updatedData, token);
            setTickets((currentTickets) => currentTickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)));
        } catch (error) {
            console.error("UPDATE TICKET ERROR:", error.message);
        }
    };

    const handleAssignTicketToMe = async (ticketId) => {
        try {
            const updatedTicket = await assignTicketToMe(ticketId, token);  
            setTickets((currentTickets) => currentTickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)));
        } catch (error) {
            console.error("ASSIGN TICKET TO ME ERROR:", error.message);
        }
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
    }

    return (
        
        <div>
            <form onSubmit={handleCreateTicket}>
                <h2>Create ticket</h2>

                <div>
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="priority">Priority</label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>

                <button type="submit">
                    Create ticket
                </button>
            </form>
            <h1>Tickets</h1>

            <p>Logged in as: {user.name}</p>

            <button onClick={handleLogout}>
                Logout
            </button>

            {tickets.map((ticket) => (
                <div key={ticket.id}>
                    <h2>{ticket.title}</h2>
                    <p>{ticket.description}</p>
                    <p>Status: {ticket.status}</p>
                    <p>Priority: {ticket.priority}</p>

                    <p>
                        Assigned to:{" "}
                        {ticket.assignedTo
                            ? ticket.assignedTo.name
                            : "Unassigned"}
                    </p>

                    {user.role === "TECHNICIAN" && !ticket.assignedTo && (
                        <button
                            onClick={() => handleAssignTicketToMe(ticket.id)}
                        >
                            Assign to me
                        </button>
                    )}

                    {user.role === "TECHNICIAN" &&
                        ticket.assignedTo?.id === user.id && (
                            <div>
                                <label htmlFor={`status-${ticket.id}`}>
                                    Status
                                </label>

                                <select
                                    id={`status-${ticket.id}`}
                                    value={ticket.status}
                                    onChange={(event) =>
                                        handleUpdateTicket(
                                            ticket.id,
                                            { status: event.target.value }
                                        )
                                    }
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="WAITING">Waiting</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        )
                    }
                </div>
            ))}
        </div>
    );
}

export default TicketPage;