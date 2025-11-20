import { fetchGroupsForUser } from '@services';
import { useQuery } from '@tanstack/react-query';

export function useGroups(userId?: string) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: () => fetchGroupsForUser(userId!),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes - groups don't change that often
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
