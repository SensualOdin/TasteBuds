import { Tables } from '@lib/database.types';
import { supabase } from '@lib/supabase';

export type Group = Tables<'groups'>;
export type GroupMember = Tables<'group_members'>;

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 6;

export function generateInviteCode() {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length);
    code += INVITE_CODE_ALPHABET[index];
  }
  return code;
}

export async function fetchGroupsForUser(userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members(*)')
    .eq('group_members.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as (Group & { group_members: GroupMember[] })[];
}

export async function createGroup({
  name,
  description,
  creatorId,
  inviteCode,
  searchZip,
  searchRadius,
}: {
  name: string;
  description?: string;
  creatorId: string;
  inviteCode: string;
  searchZip?: string | null;
  searchRadius?: number | null;
}) {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name,
      description: description ?? null,
      created_by: creatorId,
      invite_code: inviteCode,
      search_zip: searchZip ?? null,
      search_radius: searchRadius ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Group;
}

export async function updateGroupMeta(groupId: string, updates: Partial<Pick<Group, 'name' | 'description'>>) {
  const { data, error } = await supabase
    .from('groups')
    .update({
      name: updates.name,
      description: updates.description ?? null,
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Group;
}

export async function updateGroupSearchSettings({
  groupId,
  searchZip,
  searchRadius,
}: {
  groupId: string;
  searchZip?: string | null;
  searchRadius?: number | null;
}) {
  const { data, error } = await supabase
    .from('groups')
    .update({
      search_zip: searchZip ?? null,
      search_radius: searchRadius ?? null,
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Group;
}

export async function addGroupMember({
  groupId,
  userId,
  role = 'member',
}: {
  groupId: string;
  userId: string;
  role?: GroupMember['role'];
}) {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as GroupMember;
}

export async function removeGroupMember(memberId: string) {
  const { error } = await supabase.from('group_members').delete().eq('id', memberId);

  if (error) {
    throw error;
  }
}

export async function leaveGroup({ groupMemberId }: { groupMemberId: string }) {
  const { error } = await supabase.from('group_members').delete().eq('id', groupMemberId);

  if (error) {
    throw error;
  }
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);

  if (error) {
    throw error;
  }
}

export async function getGroupByInviteCode(inviteCode: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as { id: string } | null)?.id ?? null;
}
