import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSession, fetchActiveSession, recordSwipe } from '@services/session-service';
import { Session } from '@lib/database.types';

export function useActiveSession(groupId: string | undefined) {
  return useQuery({
    queryKey: ['session', 'active', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      return fetchActiveSession(groupId);
    },
    enabled: !!groupId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      // Update the cache with the new session
      queryClient.setQueryData(['session', 'active', data.group_id], data);
      // Invalidate and refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['session', 'active', data.group_id] });
    },
  });
}

export function useRecordSwipe() {
  return useMutation({
    mutationFn: recordSwipe,
  });
}

