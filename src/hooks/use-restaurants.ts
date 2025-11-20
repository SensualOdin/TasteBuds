import { fetchNearbyRestaurants, upsertRestaurants } from '@services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNearbyRestaurants({
  zipCode,
  radiusMiles,
  cuisineFilters,
  priceMin,
  priceMax,
  enabled = true,
}: {
  zipCode?: string;
  radiusMiles?: number;
  cuisineFilters?: string[];
  priceMin?: number;
  priceMax?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['restaurants', zipCode, radiusMiles, cuisineFilters, priceMin, priceMax],
    queryFn: () =>
      fetchNearbyRestaurants({
        zipCode: zipCode!,
        radiusMiles: radiusMiles ?? 10,
        cuisineFilters,
        priceMin,
        priceMax,
      }),
    enabled: enabled && Boolean(zipCode && radiusMiles),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry on failure
  });
}

export function useSaveRestaurants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertRestaurants,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

