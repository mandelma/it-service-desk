import axios from "axios";
import apiClient from "./apiClient.js";

const baseUrl = "http://localhost:3000/api/tickets";

export const getTickets = async () => {
    const response = await apiClient.get("/tickets");

    return response.data;
};

export const getTicketById = async (ticketId) => {
    const response = await apiClient.get(
        `/tickets/${ticketId}`
    );

    return response.data;
};

export const createTicket = async (ticketData) => {
    const response = await apiClient.post("/tickets", ticketData);
    return response.data;
};

export const updateTicket = async (ticketId, ticketData) => {
    const response = await apiClient.patch(`/tickets/${ticketId}`, ticketData);
    return response.data;
}

export const assignTicketToMe = async (ticketId) => {
    const response = await apiClient.patch(
        `/tickets/${ticketId}/assign-to-me`,
        {}
    );

    return response.data;
};

export const deleteTicket = async (ticketId) => {
    await apiClient.delete(`/tickets/${ticketId}`);
};