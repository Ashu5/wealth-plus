import axios from 'axios';
import { getAuthToken } from './auth-token';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/koshmitra/api').replace(/\/$/, '');

export type UserBankDetails = {
  id?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  swiftCode?: string;
  accountHolderName?: string;
  accountHolderAddress?: string;
  accountHolderPhoneNumber?: string;
  accountHolderEmail?: string;
  accountHolderDateOfBirth?: string;
  userName?: string;
  userEmail?: string;
};

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

export type BankDetails = Partial<AddBankPayload> & {
  id?: string;
  country?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  userBankDetails?: UserBankDetails;
};

const extractBankDetails = (payload: unknown): BankDetails[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as BankDetails[];
  }

  const record = payload as Record<string, unknown>;
  const inner = record.data ?? record.banks ?? record.items ?? record.result ?? record.body;

  if (Array.isArray(inner)) {
    return inner as BankDetails[];
  }

  if (inner && typeof inner === 'object') {
    const innerObj = inner as Record<string, unknown>;
    if (
      innerObj.bankName ||
      innerObj.bank_name ||
      innerObj.accountNumber ||
      innerObj.account_number ||
      innerObj.userBankDetails
    ) {
      return [innerObj as BankDetails];
    }
  }

  if (
    record.bankName ||
    record.bank_name ||
    record.accountNumber ||
    record.account_number ||
    record.userBankDetails
  ) {
    return [record as BankDetails];
  }

  return [];
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
