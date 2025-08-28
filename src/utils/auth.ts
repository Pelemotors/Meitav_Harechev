import { supabase } from './supabase';
import { User } from '../types';

export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    // Use Supabase Auth for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username, // Use username as email for now
      password: password
    });

    if (error || !data.user) {
      console.error('Login failed:', error);
      return null;
    }

    // Store user in localStorage for session management
    const userData = {
      id: data.user.id,
      username: data.user.email?.split('@')[0] || 'admin',
      email: data.user.email || '',
      role: 'admin', // Default role for now
      lastLogin: new Date()
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};