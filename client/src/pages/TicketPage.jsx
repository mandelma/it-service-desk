import { useEffect, useState } from "react";
import { getTickets, createTicket, updateTicket, assignTicketToMe, deleteTicket } from "../api/ticketApi.js";
import { getUsers } from "../api/userApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

import TicketCard from "../components/TicketCard.jsx";
import TicketForm from "../components/TicketForm.jsx";

function TicketPage() {
    const [tickets, setTickets] = useState([]);
    const [ users, setUsers ] = useState([]);

    const [ title, setTitle ] = useState("");
    const [ description, setDescription ] = useState("");
    const [ status, setStatus ] = useState("open");
    const [ priority, setPriority ] = useState("MEDIUM");

    const navigate = useNavigate();

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
                const data = await getTickets();
                setTickets(data);
            } catch (error) {
                console.error("TICKET ERROR:", error.message);
            }
        };

        loadTickets();
    }, [token]);


    const handleCreateTicket = async (ticketData) => {
        try {
            const newTicket = await createTicket(ticketData);

            setTickets((currentTickets) => [
                newTicket,
                ...currentTickets
            ]);

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

    const handleLogout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/login", { replace: true });
    }

    return (
        
        <div>
            {/* <TicketForm onCreate={async (ticketData) => {
                try {
                    const newTicket = await createTicket(ticketData);
                    setTickets((currentTickets) => [
                        newTicket,
                        ...currentTickets
                    ]);
                } catch (error) {
                    console.error("CREATE TICKET ERROR:", error.message);
                }
            }} /> */}

            <TicketForm onCreate={handleCreateTicket}
                /* title={title}
                setTitle={setTitle}  */    
            />

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