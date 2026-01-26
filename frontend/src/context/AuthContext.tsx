'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { User, authAPI, AuthResponse } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<AuthResponse>;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isServiceProvider: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.data.user);
      } else {
        // Token is invalid
        Cookies.remove('token');
        Cookies.remove('refreshToken');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        setUser(user);
        Cookies.set('token', token, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        errors: error.response?.data?.errors,
      };
    }
  };

  const register = async (userData: any): Promise<AuthResponse> => {
    try {
      const response = await authAPI.register(userData);
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        setUser(user);
        Cookies.set('token', token, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors,
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<AuthResponse> => {
    try {
      const response = await authAPI.updateProfile(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed',
        errors: error.response?.data?.errors,
      };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isCustomer: user?.userType === 'customer',
    isServiceProvider: user?.userType === 'service_provider',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
