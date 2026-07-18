import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');

export interface FixedDepositApiEntry {
  id: string;
  month: string;
  investmentType: 'Fixed Deposit';
  bank: string;
  scheme: string;
  amount: number;
  tenure: string;
  rate: number;
  maturityDate: string;
}

const candidateUrls = (username: string) => [
  `${API_BASE_URL}/deposit/fixed-deposits/username/${encodeURIComponent(username)}`,
  `${API_BASE_URL}/fixed-deposits/username/${encodeURIComponent(username)}`,
  `${API_BASE_URL}/fixed-deposits/user/${encodeURIComponent(username)}`,
  `${API_BASE_URL}/deposits/user/${encodeURIComponent(username)}`,
];

export const fetchFixedDeposits = async (username: string): Promise<FixedDepositApiEntry[]> => {
  let lastError: unknown;

  for (const url of candidateUrls(username)) {
    try {
      const response = await axios.get<FixedDepositApiEntry[]>(url);
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (error) {
      lastError = error;
    }
  }

  console.error('Error fetching fixed deposits:', lastError);
  throw new Error('Unable to fetch fixed deposit details.');
};
