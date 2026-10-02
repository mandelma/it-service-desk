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

export const updateTicket = async (ticketId, ticketData, token) => {
    const response = await axios.patch(`${baseUrl}/${ticketId}`, ticketData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}

export const assignTicketToMe = async (ticketId, token) => {
    const response = await axios.patch(
        `${baseUrl}/${ticketId}/assign-to-me`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};