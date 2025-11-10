import { fetchMatchHistory, fetchPendingInvites, respondToInvite } from '@services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePendingInvites(email?: string) {
  return useQuery({
    queryKey: ['pending-invites', email],
    queryFn: () => fetchPendingInvites(email!),
    enabled: Boolean(email),
  });
}

export function useMatchHistory(userId?: string) {
  return useQuery({
    queryKey: ['match-history', userId],
    queryFn: () => fetchMatchHistory(userId!),
    enabled: Boolean(userId),
  });
}

export function useRespondToInvite(email?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inviteId, accept }: { inviteId: string; accept: boolean }) =>
      respondToInvite({ inviteId, accept }),
    onSuccess: () => {
      if (email) {
        queryClient.invalidateQueries({ queryKey: ['pending-invites', email] });
      }
    },
  });
}
