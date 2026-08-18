import axios from 'axios';
import { getAuthToken } from './auth-token';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/koshmitra/api').replace(/\/$/, '');

export type AddBankPayload = {
  userEmail: string;
  userName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  swiftCode: string;
  bankCountry: string;
  accountHolderName: string;
  accountHolderAddress: string;
  accountHolderPhoneNumber: string;
  accountHolderEmail: string;
  accountHolderDateOfBirth: string;
  accountOpeningDate: string;
  createdAt: string;
  updatedAt: null;
};

export type BankDetails = Omit<AddBankPayload, 'updatedAt'> & {
  id?: string;
  updatedAt?: string | null;
};

const extractBankDetails = (payload: unknown): BankDetails[] => {
  if (Array.isArray(payload)) {
    return payload as BankDetails[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const collections = [record.data, record.banks, record.items];
  const bankCollection = collections.find(Array.isArray);

  if (Array.isArray(bankCollection)) {
    return bankCollection as BankDetails[];
  }

  return typeof record.bankName === 'string' ? [record as BankDetails] : [];
};

export const addBank = async (payload: AddBankPayload) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/wallet/addBank`,
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
    console.error('Unable to add bank details:', error);
    throw error;
  }
};

export const getBanksByUserEmail = async (userEmail: string): Promise<BankDetails[]> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/wallet/${encodeURIComponent(userEmail)}/banks`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );

    return extractBankDetails(response.data);
  } catch (error) {
    console.error('Unable to fetch bank details:', error);
    throw error;
  }
};
