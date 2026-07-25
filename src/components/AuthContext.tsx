
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AuthUser = {
  email: string;
  sessionId: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isCheckingSession: boolean;
  login: (sessionId: string, email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    validateStoredSession();
  }, []);

  const validateStoredSession = async () => {
    const sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
      setIsCheckingSession(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/validateSession`, {
        headers: { "X-Session-Id": sessionId },
      });

      if (!response.ok) {
        clearSession(); // covers deleted user, expired session, server restart, etc.
      } else {
        const data = await response.json();
        setUser({ email: data.data.userEmail, sessionId: data.data.sessionId });
      }
    } catch (err) {
      // network error / backend unreachable - treat as logged out rather
      // than silently trusting stale localStorage
      clearSession();
    } finally {
      setIsCheckingSession(false);
    }
  };

  const login = (sessionId: string, email: string) => {
    localStorage.setItem("sessionId", sessionId);
    setUser({ email, sessionId });
  };

  const clearSession = () => {
    localStorage.removeItem("sessionId");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isCheckingSession, login, logout: clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};