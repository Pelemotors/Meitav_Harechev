import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getCurrentUser, logout as authLogout } from '../utils/auth';
import { hasPermission, isAdmin, canManageCars, canManageLeads, canManageUsers, canAccessAdmin, Permission } from '../utils/permissions';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  isAdmin: () => boolean;
  canManageCars: () => boolean;
  canManageLeads: () => boolean;
  canManageUsers: () => boolean;
  canAccessAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        localStorage.removeItem('user');
      } else if (event === 'SIGNED_IN' && session.user) {
        const userData = {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'admin',
          email: session.user.email || '',
          role: 'admin',
          lastLogin: new Date()
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { login: authLogin } = await import('../utils/auth');
      const userData = await authLogin(username, password);
      
      if (userData) {
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    isAdmin: () => isAdmin(user),
    canManageCars: () => canManageCars(user),
    canManageLeads: () => canManageLeads(user),
    canManageUsers: () => canManageUsers(user),
    canAccessAdmin: () => canAccessAdmin(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
