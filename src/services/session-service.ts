import { Tables } from '@lib/database.types';
import { supabase } from '@lib/supabase';

export type Session = Tables<'sessions'>;
export type Swipe = Tables<'swipes'>;
export type Match = Tables<'matches'>;

export async function createSession({
  groupId,
  createdBy,
  latitude,
  longitude,
  searchRadius,
  maxMatches = 3,
  cuisineFilters,
  priceMin = 1,
  priceMax = 4,
}: {
  groupId: string;
  createdBy: string;
  latitude: number;
  longitude: number;
  searchRadius: number;
  maxMatches?: number;
  cuisineFilters?: string[];
  priceMin?: number;
  priceMax?: number;
}) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      group_id: groupId,
      created_by: createdBy,
      location_lat: latitude,
      location_lng: longitude,
      search_radius: searchRadius,
      max_matches: maxMatches,
      cuisine_filters: cuisineFilters ?? null,
      price_range_min: priceMin,
      price_range_max: priceMax,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Session;
}

export async function fetchActiveSession(groupId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Session) ?? null;
}

export async function recordSwipe({
  sessionId,
  userId,
  restaurantId,
  direction,
}: {
  sessionId: string;
  userId: string;
  restaurantId: string;
  direction: 'left' | 'right';
}) {
  const { data, error } = await supabase
    .from('swipes')
    .insert({ session_id: sessionId, user_id: userId, restaurant_id: restaurantId, direction })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Swipe;
}

export async function fetchMatches(sessionId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*, restaurants(*)')
    .eq('session_id', sessionId)
    .order('matched_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data as (Match & { restaurants: Tables<'restaurants'> })[];
}
