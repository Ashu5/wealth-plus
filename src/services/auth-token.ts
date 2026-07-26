import axios from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = 'wealth-plus-jwt-token';

const normalizeAuthToken = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^bearer\s+/i.test(trimmed)) {
    const token = trimmed.replace(/^bearer\s+/i, '').trim();
    return token || null;
  }

  return trimmed;
};

export const getAuthToken = (): string | null => {
  try {
    const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return normalizeAuthToken(storedToken);
  } catch (error) {
    console.error('Unable to read auth token from storage:', error);
    return null;
  }
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Unable to clear auth token from storage:', error);
  }

  delete axios.defaults.headers.common.Authorization;
};

export const setAuthToken = (token: string): void => {
  const normalizedToken = normalizeAuthToken(token);

  if (!normalizedToken) {
    clearAuthToken();
    return;
  }

  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalizedToken);
  } catch (error) {
    console.error('Unable to persist auth token to storage:', error);
  }

  axios.defaults.headers.common.Authorization = `Bearer ${normalizedToken}`;
};

export const hydrateAuthToken = (): void => {
  const storedToken = getAuthToken();

  if (!storedToken) {
    delete axios.defaults.headers.common.Authorization;
    return;
  }

  axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
};
