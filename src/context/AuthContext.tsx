import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';
import {
  login as apiLogin,
  signup as apiSignup,
  getCurrentUser,
  getGoogleSignInUrl,
  sendGoogleSignInCallback,
  getAuthToken,
  setAuthToken,
} from '../mocks/api';

interface AuthContextType extends AuthState {
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (code: string, state: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setToken(existingToken);
    } catch (e) {
      console.warn('Session check failed, clearing token:', e);
      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(identifier, password);
      setToken(response.access_token);
      setAuthToken(response.access_token);

      if (response.user) {
        setUser(response.user);
      } else {
        const profile = await getCurrentUser();
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiSignup(name, email, password);
      setToken(response.access_token);
      setAuthToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const { auth_url } = await getGoogleSignInUrl();
    window.location.href = auth_url;
  };

  const handleGoogleCallback = async (code: string, state: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await sendGoogleSignInCallback(code, state);
      setToken(response.access_token);
      setAuthToken(response.access_token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updated = await getCurrentUser();
      setUser(updated);
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = !!user && (user.is_admin || user.role === 'admin' || user.email?.toLowerCase() === 'hiten8411jdrravi@gmail.com');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        handleGoogleCallback,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
