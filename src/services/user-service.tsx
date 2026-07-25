import axios from 'axios';
import type { UserRegisterRequest } from '../models/user-register-request';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');
console.log('API base URL:', import.meta.env.VITE_API_BASE_URL);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const trackLoginActivity = async (userEmail: string): Promise<string | undefined> => {
  try {
    const url = `${API_BASE_URL}/activity/user/${userEmail}/active`;
    const response = await axios.get(
      url,
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
    const response = await axios.post(
      url,
      {
        userEmail,
        sessionId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    return response;
  } catch (error) {
    console.error('Error tracking logout activity:', error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    console.log('Login response:', response);
    return response;
  } catch (error) {
    console.error('Error signing in:', error);

    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response;
      const payload = errorResponse.data;
      const normalizedPayload =
        typeof payload === 'object' && payload !== null
          ? (payload as Record<string, unknown>)
          : { message: typeof payload === 'string' ? payload : 'Unable to sign in.' };

      if (typeof normalizedPayload.status !== 'number') {
        normalizedPayload.status = errorResponse.status;
      }

      return {
        status: errorResponse.status,
        data: normalizedPayload,
        headers: errorResponse.headers,
        config: errorResponse.config,
      };
    }

    throw error;
  }
};
export const registerUser = async (userData: UserRegisterRequest) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/register`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const assignUsername = async (email: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/assignUsername/${encodeURIComponent(email.trim())}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning username:', error);
    throw error;
  }
};

export const profileDetails = async (userEmail: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/profile/${encodeURIComponent(userEmail.trim())}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching profile details:', error);
    throw error;
  }
};


export const googleLogin = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const token = await user.getIdToken();

  const response = await axios.post(
    `${API_BASE_URL}/auth/sso-login`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );

  return { user, token, response };
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/update/resetPassword`,
      { token, newPassword },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};
