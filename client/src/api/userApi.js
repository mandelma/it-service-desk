import axios from "axios";

const baseUrl = "http://localhost:3000/api/users";

export const getUsers = async (token) => {
    const response = await axios.get(baseUrl, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};