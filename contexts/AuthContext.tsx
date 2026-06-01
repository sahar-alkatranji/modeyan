import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api, ApiUser } from '../services/api';

export interface AuthContextType {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('modeya_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(!user && api.isAuthenticated());

  useEffect(() => {
    // F1: Set up global unauthorized listener
    api.onUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('modeya_user');
    };

    const restoreSession = async () => {
      if (api.isAuthenticated()) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          localStorage.setItem('modeya_user', JSON.stringify(userData));
        } catch (error) {
          console.error("Session restoration failed", error);
          // If it was a 401, api.ts already cleared everything
          if (!api.isAuthenticated()) {
            setUser(null);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('modeya_user');
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.user);
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string; phone?: string; role?: string }) => {
    const response = await api.register(data);
    setUser(response.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ useAuth is now in a separate file: contexts/useAuth.ts
// Keeping it here as well for backward compatibility with existing imports
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
