import { createClient } from '@supabase/supabase-js';
import { Car, User, MediaFile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      cars: {
        Row: Car;
        Insert: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'lastLogin'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      media_files: {
        Row: MediaFile;
        Insert: Omit<MediaFile, 'id' | 'createdAt'>;
        Update: Partial<Omit<MediaFile, 'id' | 'createdAt'>>;
      };
    };
  };
}; 