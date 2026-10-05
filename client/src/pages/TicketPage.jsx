import { useEffect, useState } from "react";
import { getTickets, createTicket, updateTicket, assignTicketToMe, deleteTicket } from "../api/ticketApi.js";
import { getUsers } from "../api/userApi.js";
import { useAuth } from "../context/AuthContext.jsx";

import TicketCard from "../components/TicketCard.jsx";
import TicketForm from "../components/TicketForm.jsx";

function TicketPage() {
    const [tickets, setTickets] = useState([]);
    const [ users, setUsers ] = useState([]);

    const [ title, setTitle ] = useState("");
    const [ description, setDescription ] = useState("");
    const [ status, setStatus ] = useState("open");
    const [ priority, setPriority ] = useState("MEDIUM");

    const { token, user, setUser, setToken } = useAuth();

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

    useEffect(() => {
        console.log("USERS CHANGED:", users);
    }, [users]);


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

    const handleDeleteTicket = async (ticketId) => {
        try {
            await deleteTicket(ticketId, token);
            setTickets((currentTickets) => currentTickets.filter((ticket) => ticket.id !== ticketId));
        } catch (error) {
            console.error("DELETE TICKET ERROR:", error.message);
        }
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
    }

    return (
        
        <div>
            <TicketForm onCreate={async (ticketData) => {
                try {
                    const newTicket = await createTicket(ticketData, token);
                    setTickets((currentTickets) => [
                        newTicket,
                        ...currentTickets
                    ]);
                } catch (error) {
                    console.error("CREATE TICKET ERROR:", error.message);
                }
            }} />

            
            {/* <form onSubmit={handleCreateTicket}>
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
            </form> */}
            <h1>Tickets</h1>

            <p>Logged in as: {user.name}</p>

            <button onClick={handleLogout}>
                Logout
            </button>

            {tickets.map((ticket) => (
                <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    user={user}
                    users={users}
                    onDelete={handleDeleteTicket}
                    onAssignTicketToMe={handleAssignTicketToMe}
                    onUpdate={handleUpdateTicket}
                />
            ))}

        </div>
    );
}

export default TicketPage;