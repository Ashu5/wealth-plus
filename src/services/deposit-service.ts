import axios from 'axios';
import { getAuthToken } from './auth-token';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');

export interface FixedDepositApiEntry {
  id: string;
  fdNumber?: string;
  month: string;
  investmentType: 'Fixed Deposit';
  bank: string;
  bankName?: string;
  scheme: string;
  // fdNumber?: string;
  amount: number;
  amountFixed?: number | string;
  maturityAmount?: number | string;
  tenure: string;
  rate: number;
  interestRate?: number | string;
  maturityDate: string;
  active?: boolean;
  isActive?: boolean;
  userName?: string;
  userEmail?: string;
  transactionDate?: string;
}

export type UpdateFixedDepositPayload = {
  fdNumber: string;
  userName: string;
  userEmail: string;
  amountFixed: string;
  maturityAmount: string;
  maturityDate: string;
  interestRate: string;
  tenure: string;
  bankName: string;
  active: boolean;
};

const candidateUrls = (username: string) => [
  `${API_BASE_URL}/fixedDeposit/user/${encodeURIComponent(username)}`,
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

export const updateFixedDeposit = async (fdId: string, payload: UpdateFixedDepositPayload) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API_BASE_URL}/fund-master/updateFd/${encodeURIComponent(fdId)}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating fixed deposit:', error);
    throw error;
  }
};
