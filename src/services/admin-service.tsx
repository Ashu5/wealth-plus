import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');

export type AdminRole = 'READ_ONLY' | 'CAN_EDIT' | 'DELETE';

type AdminHeaders = Record<string, string>;

const getAdminHeaders = (): AdminHeaders => {
  const adminEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';
  const headers: AdminHeaders = {
    'Content-Type': 'application/json',
  };

  if (adminEmail) {
    headers['X-Admin-Email'] = adminEmail;
  }

  return headers;
};

export const searchUsers = async (searchTerm: string) => {
  const response = await axios.get(`${API_BASE_URL}/admin/users`, {
    headers: getAdminHeaders(),
    params: searchTerm ? { search: searchTerm } : undefined,
    withCredentials: true,
  });

  return response.data;
};

export const updateUserRole = async (email: string, newRole: AdminRole) => {
  const response = await axios.put(
    `${API_BASE_URL}/admin/users/role`,
    { email, newRole },
    {
      headers: getAdminHeaders(),
      withCredentials: true,
    }
  );

  return response.data;
};

export const addNewUser = async (payload: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: AdminRole;
}) => {
  const response = await axios.post(`${API_BASE_URL}/admin/users`, payload, {
    headers: getAdminHeaders(),
    withCredentials: true,
  });

  return response.data;
};

export const getActiveSessions = async () => {
  const response = await axios.get(`${API_BASE_URL}/admin/sessions/active`, {
    headers: getAdminHeaders(),
    withCredentials: true,
  });

  return response.data;
};

export const forceLogoutUser = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/admin/sessions/${encodeURIComponent(email)}/forceLogout`, {}, {
    headers: getAdminHeaders(),
    withCredentials: true,
  });

  return response.data;
};
