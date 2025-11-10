import { Tables } from '@lib/database.types';
import { supabase } from '@lib/supabase';

export type UserProfile = Tables<'users'>;

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserProfile) ?? null;
}

type UpdateUserProfileInput = {
  email: string;
  displayName?: string;
  cuisinePreferences?: string[] | null;
  distancePreference?: number | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
};

export async function updateUserProfile(userId: string, updates: UpdateUserProfileInput) {
  const safeDisplayName = (updates.displayName ?? updates.email).trim() || updates.email;

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        email: updates.email,
        display_name: safeDisplayName,
        cuisine_preferences: updates.cuisinePreferences ?? null,
        distance_preference: updates.distancePreference ?? null,
        price_range_min: updates.priceRangeMin ?? null,
        price_range_max: updates.priceRangeMax ?? null,
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}
