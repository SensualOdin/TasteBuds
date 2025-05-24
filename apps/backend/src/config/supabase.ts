import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
}

// For development, if service key is not provided, we'll use anon key
// In production, you MUST use the service role key for admin operations
const serviceKey = supabaseServiceKey && supabaseServiceKey !== 'temp-key' ? supabaseServiceKey : supabaseAnonKey;

// Service client for admin operations (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Public client for general operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string;
  location_lat?: number;
  location_lng?: number;
  cuisine_preferences?: string[];
  price_range_min: number;
  price_range_max: number;
  distance_preference: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_active: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Session {
  id: string;
  group_id: string;
  created_by: string;
  status: 'active' | 'completed' | 'cancelled';
  location_lat: number;
  location_lng: number;
  search_radius: number;
  price_range_min: number;
  price_range_max: number;
  cuisine_filters?: string[];
  max_matches: number;
  current_matches: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  place_id: string;
  yelp_id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  cuisine_types?: string[];
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  photo_urls?: string[];
  opening_hours?: any;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: string;
  session_id: string;
  user_id: string;
  restaurant_id: string;
  direction: 'left' | 'right';
  created_at: string;
}

export interface Match {
  id: string;
  session_id: string;
  restaurant_id: string;
  matched_at: string;
} 