import { Tables } from '@lib/database.types';
import { supabase } from '@lib/supabase';
import { fetchGroupsForUser } from './group-service';

export type Invite = {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_email: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
};

export async function fetchPendingInvites(email: string) {
  const { data, error } = await supabase.rpc('get_pending_invites' as never, {
    invitee_email: email,
  } as never);

  if (error) {
    throw error;
  }

  return data as Invite[];
}

export async function respondToInvite({
  inviteId,
  accept,
}: {
  inviteId: string;
  accept: boolean;
}) {
  const { error } = await supabase.rpc('respond_to_invite' as never, {
    invite_id: inviteId,
    accept,
  } as never);

  if (error) {
    throw error;
  }
}

export async function fetchMatchHistory(userId: string) {
  const groups = await fetchGroupsForUser(userId);
  const groupIds = groups.map((g) => g.id);

  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from('matches')
    .select('*, sessions!inner(group_id, created_at), restaurants(*)')
    .in('sessions.group_id', groupIds)
    .order('matched_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as (Tables<'matches'> & {
    sessions: Pick<Tables<'sessions'>, 'group_id' | 'created_at'>;
    restaurants: Tables<'restaurants'>;
  })[];
}
