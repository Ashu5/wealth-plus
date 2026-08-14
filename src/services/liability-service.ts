import axios from 'axios';
import { getAuthToken } from './auth-token';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/koshmitra/api').replace(/\/$/, '');

export type AddLiabilityPayload = {
  userName: string;
  userEmail: string;
  liabilityNumber: string;
  liabilityType: string;
  liabilityName: string;
  lender: string;
  liabilityAmount: string;
  outstandingAmount: string;
  interestRate: string;
  emiAmount: string;
  startDate: string;
  endDate: string;
};

export type LiabilityApiRecord = {
  liabilityNumber?: string;
  liabilityType?: string;
  liabilityName?: string;
  lender?: string;
  liabilityAmount?: number | string | null;
  outstandingAmount?: number | string | null;
  amount?: number | string | null;
  loanNumber?: string;
  loanProvider?: string;
  currentOutstanding?: number | string | null;
  loanDate?: string;
  startDate?: string;
  endDate?: string;
  interestRate?: number | string | null;
  emiAmount?: number | string | null;
  [key: string]: unknown;
};

export type UpdateOutstandingPayload = {
  liabilityNumber: string;
  userEmail: string;
  outstandingAmount: number | string;
};

export const fetchUserLiabilities = async (userEmail: string) => {
  try {
    const authToken = getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/liability/user/${encodeURIComponent(userEmail.trim())}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        withCredentials: true,
      }
    );

    const payload = response.data;
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.data)) {
      return payload.data;
    }

    if (payload && Array.isArray(payload.liabilities)) {
      return payload.liabilities;
    }

    return [];
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    throw error;
  }
};

export const addLiability = async (payload: AddLiabilityPayload) => {
  try {
    const authToken = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/liability/add`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error adding liability:', error);
    throw error;
  }
};

export const updateOutstandingAmount = async (payload: UpdateOutstandingPayload) => {
  try {
    const authToken = getAuthToken();
    const response = await axios.put(
      `${API_BASE_URL}/liability/updateOutstanding`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating liability outstanding amount:', error);
    throw error;
  }
};
