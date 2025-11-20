import { fetchMatches, fetchMatchHistory } from '@services';
import { useQuery } from '@tanstack/react-query';

export function useMatches(sessionId?: string) {
  return useQuery({
    queryKey: ['matches', sessionId],
    queryFn: () => fetchMatches(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useMatchHistory(userId?: string) {
  return useQuery({
    queryKey: ['match-history', userId], // Use same key as use-invites.ts for consistency
    queryFn: () => fetchMatchHistory(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes - matches don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
  });
}
