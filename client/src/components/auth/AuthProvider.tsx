import React, { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from '../../hooks/use-auth';
import { User } from '@/lib/types';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '@/lib/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await loginUser(email, password);
      setUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  // Register user
  const register = async (
    email: string,
    password: string,
    userData?: Record<string, any>
  ) => {
    setIsLoading(true);
    try {
      const user = await registerUser(email, password, userData);
      setUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}