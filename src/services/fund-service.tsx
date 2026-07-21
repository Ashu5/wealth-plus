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

export const generateFundCode = async (params: { fundName: string; fundType: string; folioNumber: string }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fund-master/generateFundCode`, {
            params,
        });

        return response.data;
    } catch (error) {
        console.error("Error generating fund code:", error);
        throw error;
    }
};


export const addFixedDeposit = async (fixedDepositData: any) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/fixedDeposit/add`,
            fixedDepositData,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error adding fixed deposit:", error);
        throw error;
    }
};

export const getUserFixedDeposits = async (userName: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fixedDeposit/user/${encodeURIComponent(userName)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user fixed deposits:", error);
        throw error;
    }
};