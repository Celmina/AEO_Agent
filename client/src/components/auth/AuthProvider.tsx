import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { loginUser, registerUser, getCurrentUser, logoutUser } from "@/lib/auth";
import { AuthContext } from "@/hooks/use-auth";
import { User } from "@/lib/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  async function loadUser() {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userData = await loginUser(email, password);
      setUser(userData);
      setLocation('/dashboard');
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      return userData;
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    userData?: Record<string, any>,
  ): Promise<User> => {
    try {
      const newUser = await registerUser(email, password, userData);
      setUser(newUser);
      setLocation('/connect-website');
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
      return newUser;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again with a different email.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
      setUser(null);
      setLocation('/');
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}