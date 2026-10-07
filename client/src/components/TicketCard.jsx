import { Link } from "react-router-dom";

const TicketCard = ({ 
    ticket,
    user,
    users,
    onAssignTicketToMe,
    onUpdate,
    onDelete
 }) => {
    return (
        <div>
            <h2>
                <Link to={`/tickets/${ticket.id}`}>
                    {ticket.title}
                </Link>
            </h2>
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
                    onClick={() => onAssignTicketToMe(ticket.id)}
                >
                    Assign to me
                </button>
            )}

            {user.role === "ADMIN" && (
                <button
                    onClick={() => onDelete(ticket.id)}
                >
                    Delete
                </button>
            )}

            {user.role === "ADMIN" && (
                <div>
                    <label htmlFor={`technician-${ticket.id}`}>
                        Assigned to
                    </label>

                    <select
                        id={`technician-${ticket.id}`}
                        value={ticket.assignedTo?.id || ""}
                        onChange={(event) =>
                            onUpdate(
                                ticket.id,
                                {
                                    assignedToId:
                                        event.target.value || null
                                }
                            )
                        }
                    >
                        <option value="">Unassigned</option>

                        {users
                            .filter((user) => user.role === "TECHNICIAN")
                            .map((technician) => (
                                <option
                                    key={technician.id}
                                    value={technician.id}
                                >
                                    {technician.name}
                                </option>
                            ))}
                    </select>
                </div>
            )}


            {(user.role === "TECHNICIAN" &&
                ticket.assignedTo?.id === user.id) ||
                user.role === "ADMIN" && (
                    <div>
                        <label htmlFor={`status-${ticket.id}`}>
                            Status
                        </label>

                        <select
                            id={`status-${ticket.id}`}
                            value={ticket.status}
                            onChange={(event) =>
                                onUpdate(ticket.id, { status: event.target.value })
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
    );
}

export default TicketCard;