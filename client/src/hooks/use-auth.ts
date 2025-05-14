import { createContext, useContext } from 'react';
import { User } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    userData?: Record<string, any>
  ) => Promise<User>;
  logout: () => Promise<void>;
}

const initialState: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => Promise.reject(new Error('Not implemented')),
  register: () => Promise.reject(new Error('Not implemented')),
  logout: () => Promise.reject(new Error('Not implemented')),
};

export const AuthContext = createContext<AuthContextType>(initialState);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
