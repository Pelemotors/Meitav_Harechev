import { supabase } from './supabase';
import { User } from '../types';

export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    // Check credentials against users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) // Simple password check
      .single();

    if (error || !data) {
      console.error('Login failed:', error);
      return null;
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    // Store user in localStorage for session management
    const userData = {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logout = (): void => {
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