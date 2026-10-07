import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTicketById } from "../api/ticketApi.js";

const TicketDetailPage = () => {
    const { id } = useParams();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTicket = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getTicketById(id);
                setTicket(data);
            } catch (error) {
                console.error(
                    "GET TICKET ERROR:",
                    error.message
                );

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

    return (
        <div>
            <h1>{ticket.title}</h1>

            <Link to="/tickets">
                ← Back to Tickets
            </Link>

            <p>{ticket.description}</p>
            <p>Status: {ticket.status}</p>
            <p>Priority: {ticket.priority}</p>

            <p>
                Created by: {ticket.createdBy?.name}
            </p>

            <p>
                Assigned to:{" "}
                {ticket.assignedTo
                    ? ticket.assignedTo.name
                    : "Unassigned"}
            </p>
        </div>
    );
}

export default TicketDetailPage;