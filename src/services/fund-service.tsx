import axios from "axios";
import { getAuthToken } from './auth-token';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/koshmitra/api').replace(/\/$/, '');


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


export const getUserFundsV2 = async (userEmail: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fund-master/allUserFunds/v2/${userEmail}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user funds:", error);
        throw error;
    }
};

export const updateFund = async (fundId: string, fundData: any) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/fund-master/updateFund/${encodeURIComponent(fundId)}`,
            fundData,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error updating fund:", error);
        throw error;
    }
};

type UpdateFundV2Payload = {
    fundName: string;
    fundCode: string;
    fundType: string;
    folioNumber: string;
    fundAmount: string;
    platform: {
        platformName: string;
        platformCode: string;
        platformDescription: string;
    };
    currency: string;
    userName: string;
    userEmail: string;
};

export const updateFundV2 = async (fundCode: string, payload: UpdateFundV2Payload) => {
    try {
        const token = getAuthToken();
        const response = await axios.put(
            `${API_BASE_URL}/fund-master/updateFund/${encodeURIComponent(fundCode)}`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error updating fund v2:", error);
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

export const generateFundCodeV2 = async (fundName: string, fundType: string, folioNumber: string) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/fund-master/generateFundCode/v2`,
            { fundName, fundType, folioNumber },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error generating fund code:", error);
        throw error;
    }
};

export const getMatchingFunds = async (fundName: string) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(
            `${API_BASE_URL}/fund-master/matchingFunds/${encodeURIComponent(fundName)}`,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error fetching matching funds:", error);
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

export const getUserFixedDeposits = async (userEmail: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fixedDeposit/user/${encodeURIComponent(userEmail)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user fixed deposits:", error);
        throw error;
    }
};

export const addFundV2 = async (fundData:any) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/fund-master/addFund/v2`,
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

export const getPlatformDetailsByCurrency = async (currency: string) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(
            `${API_BASE_URL}/platforms/by-currency/${encodeURIComponent(currency)}`,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error fetching platform details by currency:', error);
        throw error;
    }
};

export type AddPlatformPayload = {
    platformByCurrency: string;
    platform: {
        platformName: string;
        platformCode: string;
        platformDescription: string;
        currency: string;
    };
};

export const addPlatform = async (currency: string, payload: AddPlatformPayload) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${API_BASE_URL}/platforms/add`,
            payload,
            {
                params: { currency },
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error adding platform:', error);
        throw error;
    }
};