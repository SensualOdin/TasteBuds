import { fetchUserProfile, updateUserProfile } from '@services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpdateUserProfile(userId?: string, email?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      displayName?: string;
      cuisinePreferences?: string[] | null;
      distancePreference?: number | null;
      priceRangeMin?: number | null;
      priceRangeMax?: number | null;
    }) => updateUserProfile(userId!, { ...input, email: email! }),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      }
    },
  });
}
