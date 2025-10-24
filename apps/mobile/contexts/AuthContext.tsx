import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import type { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Validate token by fetching current user
        try {
          const { user: currentUser } = await api.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear auth
          await api.clearAuth();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const response = await api.register(email, password, displayName);
      setUser(response.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const { user: updatedUser } = await api.updateProfile(updates);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.response?.data?.error || 'Update failed');
    }
  };

  const refreshUser = async () => {
    try {
      const { user: currentUser } = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
