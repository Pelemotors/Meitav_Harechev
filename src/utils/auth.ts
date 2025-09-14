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

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if user is authenticated with Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Clear local storage if no valid Supabase session
      localStorage.removeItem('user');
      return null;
    }

    // Return user from local storage if Supabase session is valid
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        // Verify the user ID matches Supabase user ID
        if (localUser.id === user.id) {
          return localUser;
        }
      } catch {
        // Invalid local storage data
      }
    }
    
    // If no valid local storage, create user object from Supabase data
    const userData = {
      id: user.id,
      username: user.email?.split('@')[0] || 'admin',
      email: user.email || '',
      role: 'admin', // Default role for now
      lastLogin: new Date()
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

// Check if there are multiple users in the system (security check)
export const checkUserCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id', { count: 'exact' });
    
    if (error) {
      console.error('Error checking user count:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error checking user count:', error);
    return 0;
  }
};

// Allow only one admin user in the system
export const validateSingleAdmin = async (): Promise<boolean> => {
  try {
    const userCount = await checkUserCount();
    
    // If there are users in the database, check if current user is authorized
    if (userCount > 0) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return false;
      }
      
      // Check if current user exists in database
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .single();
      
      if (error || !data) {
        console.error('User not found in database:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating single admin:', error);
    return false;
  }
};