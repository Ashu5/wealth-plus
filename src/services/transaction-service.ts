import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');

export interface FundTransaction {
  folioNumber: string;
  fundName: string;
  fundType: string | null;
  amount: number;
  fundCode: string;
  transactionDate: string;
  nav: number;
  units: number;
  userName: string | null;
}

export const fetchUserFundTransactions = async (userName: string, fundName: string) => {
  const url = `${API_BASE_URL}/transactions/userFundTransactions`;
  
  try {
    const response = await axios.post<FundTransaction[]>(url, {
      userName,
      fundName,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching fund transactions:', error);
    throw error;
  }
};

export const addFundTransaction = async (transaction: FundTransaction) => {
  const url = `${API_BASE_URL}/transactions/addFundTransaction`;
  try {
    const response = await axios.post(url, transaction);
    return response.data;
  } catch (error) {
    console.error('Error adding fund transaction:', error);
    throw error;
  }
};
