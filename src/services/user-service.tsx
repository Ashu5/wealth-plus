import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');

export const trackLoginActivity = async (userEmail: string): Promise<string | undefined> => {
  try {
    const url = `${API_BASE_URL}/activity/login`;
    const response = await axios.post(
      url,
      null,
      {
        params: {
          userEmail
        },
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    return response.data?.sessionId;
  } catch (error) {
    console.error('Error tracking login activity:', error);
    return undefined;
  }
};

export const trackLogoutActivity = async (userEmail: string, sessionId: string) => {
  try {
    const url = `${API_BASE_URL}/activity/logout`;
    await axios.post(
      url,
      {
        userEmail,
        sessionId,
      },
      {
        params: {
          userEmail
        },
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error('Error tracking logout activity:', error);
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/signin`,
      {
        email,
        password
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};
