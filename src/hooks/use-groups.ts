import { fetchGroupsForUser } from '@services';
import { useQuery } from '@tanstack/react-query';

export function useGroups(userId?: string) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: () => fetchGroupsForUser(userId!),
    enabled: Boolean(userId),
  });
}
