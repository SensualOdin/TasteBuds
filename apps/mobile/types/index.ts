export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  cuisinePreferences?: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  distancePreference: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_active: boolean;
  max_members: number;
  created_at: string;
  group_members: GroupMember[];
}

export interface GroupMember {
  id: string;
  role: 'admin' | 'member';
  joined_at: string;
  users: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
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
  created_at: string;
  groups?: Group;
}

export interface Restaurant {
  id: string;
  placeId: string;
  yelpId?: string;
  name: string;
  cuisine: string[];
  priceLevel: number;
  rating: number;
  photoUrls: string[];
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  hours?: any;
  distance?: number;
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
  restaurants?: Restaurant;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}
