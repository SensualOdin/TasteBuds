import { useGroups } from '@hooks';
import {
  addGroupMember,
  createGroup,
  generateInviteCode,
  getGroupByInviteCode,
  Group,
  GroupMember,
} from '@services';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, InputField, Surface } from '@ui';
import { showErrorToast, showToast } from '@utils/toast';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const user = useSessionStore((state) => state.user);
  const { data: groups = [], isRefetching, refetch } = useGroups(user?.id);

  const [formMode, setFormMode] = useState<'create' | 'join' | null>(null);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForms = () => {
    setFormMode(null);
    setGroupName('');
    setInviteCode('');
    setIsSubmitting(false);
  };

  const handleCreateGroup = async () => {
    if (!user?.id) {
      showErrorToast({ title: 'You must be signed in to create a group.' });
      return;
    }
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      showErrorToast({ title: 'Give your group a name.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const group = await createGroup({
        name: trimmedName,
        creatorId: user.id,
        inviteCode: generateInviteCode(),
        searchRadius: 10,
      });

      try {
        await addGroupMember({ groupId: group.id, userId: user.id, role: 'admin' });
      } catch (memberError) {
        console.warn('Unable to attach creator as member', memberError);
      }

      showToast({ title: 'Group created!' });
      resetForms();
      await refetch();
      router.push(`/(app)/groups/${group.id}`);
    } catch (error) {
      console.error(error);
      showErrorToast({ title: 'Unable to create group', message: 'Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user?.id) {
      showErrorToast({ title: 'You must be signed in to join a group.' });
      return;
    }
    const sanitizedCode = inviteCode.trim().toUpperCase();
    if (!sanitizedCode) {
      showErrorToast({ title: 'Enter an invite code to join.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const inviteGroupId = await getGroupByInviteCode(sanitizedCode);

      if (!inviteGroupId) {
        showErrorToast({ title: 'Invite not found', message: 'Double-check the code and try again.' });
        setIsSubmitting(false);
        return;
      }

      await addGroupMember({ groupId: inviteGroupId, userId: user.id });
      showToast({ title: 'Joined group!' });
      resetForms();
      await refetch();
      router.push(`/(app)/groups/${inviteGroupId}`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : undefined;
      showErrorToast({ title: 'Unable to join group', message });
      setIsSubmitting(false);
    }
  };

  const renderGroups = () => {
    if (!groups.length) {
      return (
        <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
          <AppText variant="headline" align="center">
            No Groups Yet
          </AppText>
          <AppText tone="secondary" align="center">
            Create a group to start swiping on restaurants with friends.
          </AppText>
          <Button
            label="Create Group"
            size="lg"
            style={{ marginTop: spacing.lg }}
            onPress={() => setFormMode('create')}
          />
        </Surface>
      );
    }

    return groups.map((group: Group & { group_members: GroupMember[] }) => (
      <Surface key={group.id} variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
        <AppText variant="title">{group.name}</AppText>
        {group.description ? <AppText tone="secondary">{group.description}</AppText> : null}
        <AppText tone="muted">Members: {group.group_members.length}</AppText>
        <Button
          label="Open Lobby"
          variant="primary"
          onPress={() => router.push(`/(app)/groups/${group.id}`)}
        />
      </Surface>
    ));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        <View style={{ gap: spacing.lg }}> 
          <AppText variant="headline">Your Groups</AppText>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button label="Create Group" variant="primary" style={{ flex: 1 }} onPress={() => setFormMode('create')} />
            <Button label="Join Group" variant="outline" style={{ flex: 1 }} onPress={() => setFormMode('join')} />
          </View>

          {formMode === 'create' ? (
            <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.md }}>
              <AppText variant="title">Create a New Group</AppText>
              <InputField
                label="Group Name"
                placeholder="Friday Foodies"
                value={groupName}
                onChangeText={setGroupName}
              />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  style={{ flex: 1 }}
                  onPress={resetForms}
                  disabled={isSubmitting}
                />
                <Button
                  label={isSubmitting ? 'Creating…' : 'Create'}
                  variant="primary"
                  style={{ flex: 1 }}
                  onPress={handleCreateGroup}
                  disabled={isSubmitting}
                />
              </View>
            </Surface>
          ) : null}

          {formMode === 'join' ? (
            <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.md }}>
              <AppText variant="title">Join with an Invite Code</AppText>
              <InputField
                label="Invite Code"
                placeholder="ABCDE"
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
              />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  style={{ flex: 1 }}
                  onPress={resetForms}
                  disabled={isSubmitting}
                />
                <Button
                  label={isSubmitting ? 'Joining…' : 'Join'}
                  variant="primary"
                  style={{ flex: 1 }}
                  onPress={handleJoinGroup}
                  disabled={isSubmitting}
                />
              </View>
            </Surface>
          ) : null}

          {renderGroups()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 24,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
});
