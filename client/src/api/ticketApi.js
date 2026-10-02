import axios from "axios";

const baseUrl = "http://localhost:3000/api/tickets";

export const getTickets = async (token) => {
    const response = await axios.get(baseUrl, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const createTicket = async (ticketData, token) => {
    const response = await axios.post(baseUrl, ticketData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};