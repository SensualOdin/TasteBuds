import { fetchMatches } from '@services';
import { useQuery } from '@tanstack/react-query';

export function useMatches(sessionId?: string) {
  return useQuery({
    queryKey: ['matches', sessionId],
    queryFn: () => fetchMatches(sessionId!),
    enabled: Boolean(sessionId),
  });
}
