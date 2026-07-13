import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');


export const addFund = async (fundData:any) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/fund-master/addFund`,
            fundData,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error adding fund:", error);
        throw error;
    }
};

export const getUserFunds = async (userId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fund-master/allUserFunds/${encodeURIComponent(userId)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user funds:", error);
        throw error;
    }
};
