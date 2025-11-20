import { fetchPendingInvites, respondToInvite } from '@services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePendingInvites(email?: string) {
  return useQuery({
    queryKey: ['pending-invites', email],
    queryFn: () => fetchPendingInvites(email!),
    enabled: Boolean(email),
    staleTime: 1 * 60 * 1000, // 1 minute - invites can change more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // Check for new invites every 30 seconds
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
