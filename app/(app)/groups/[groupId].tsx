import { useGroups } from '@hooks';
import {
  deleteGroup,
  generateInviteCodeForGroup,
  leaveGroup,
  removeGroupMember,
  updateGroupMeta,
  updateGroupSearchSettings,
} from '@services';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, InputField, Surface } from '@ui';
import { showErrorToast, showToast } from '@utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupLobbyScreen() {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const { data: groups = [], isRefetching, refetch } = useGroups(user?.id);

  const group = useMemo(() => groups.find((entry) => entry.id === groupId), [groups, groupId]);

  const isCreator = group?.created_by === user?.id;

  const [isEditingSearch, setIsEditingSearch] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [searchZip, setSearchZip] = useState('');
  const [searchRadius, setSearchRadius] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (group) {
      setSearchZip(group.search_zip ?? '');
      setSearchRadius(group.search_radius ? String(group.search_radius) : '');
      setGroupName(group.name ?? '');
      setGroupDescription(group.description ?? '');
    }
  }, [group]);

  const handleShareInvite = async () => {
    if (!group) return;

    setIsGeneratingCode(true);

    try {
      // If no invite code exists, generate one first
      let inviteCode = group.invite_code;
      if (!inviteCode) {
        const updatedGroup = await generateInviteCodeForGroup(group.id);
        inviteCode = updatedGroup.invite_code;
        // Refresh the groups data to get the new invite code
        await refetch();
      }

      if (!inviteCode) {
        showErrorToast({ title: 'Unable to generate invite code', message: 'Please try again.' });
        setIsGeneratingCode(false);
        return;
      }

      // Share the invite code
      Share.share({
        message: `Join my Taste Buds group "${group.name}" with code ${inviteCode}.`,
      }).catch((error) => {
        console.error(error);
        showErrorToast({ title: 'Unable to share', message: 'Please try again.' });
      });
    } catch (error) {
      console.error(error);
      showErrorToast({ title: 'Unable to generate invite code', message: 'Please try again.' });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!group) return;
    setIsSaving(true);

    const radiusNumber = searchRadius.trim() ? Number(searchRadius.trim()) : null;
    if (radiusNumber !== null && (Number.isNaN(radiusNumber) || radiusNumber <= 0)) {
      showErrorToast({ title: 'Radius must be a positive number.' });
      setIsSaving(false);
      return;
    }

    try {
      await updateGroupSearchSettings({ groupId: group.id, searchZip: searchZip.trim() || null, searchRadius: radiusNumber });
      showToast({ title: 'Search preferences saved!' });
      setIsEditingSearch(false);
      await refetch();
    } catch (error) {
      console.error(error);
      showErrorToast({ title: 'Unable to save search settings', message: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!group) return;
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      showErrorToast({ title: 'Group name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateGroupMeta(group.id, {
        name: trimmedName,
        description: groupDescription.trim() || null,
      });
      showToast({ title: 'Group updated!' });
      setIsEditingMeta(false);
      await refetch();
    } catch (error) {
      console.error(error);
      showErrorToast({ title: 'Unable to update group', message: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert(
      'Remove member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGroupMember(memberId);
              showToast({ title: 'Member removed' });
              await refetch();
            } catch (error) {
              console.error(error);
              showErrorToast({ title: 'Unable to remove member', message: 'Please try again.' });
            }
          },
        },
      ],
    );
  };

  const handleLeaveGroup = () => {
    if (!group || !user?.id) return;
    const membership = group.group_members.find((member) => member.user_id === user.id);
    if (!membership) {
      showErrorToast({ title: 'Membership not found' });
      return;
    }

    Alert.alert('Leave group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup({ groupMemberId: membership.id });
            showToast({ title: 'You left the group.' });
            router.replace('/(app)/groups');
          } catch (error) {
            console.error(error);
            showErrorToast({ title: 'Unable to leave group', message: 'Please try again.' });
          }
        },
      },
    ]);
  };

  const handleDisbandGroup = () => {
    if (!group) return;
    Alert.alert('Disband group', 'This will remove the group for everyone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disband',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(group.id);
            showToast({ title: 'Group removed.' });
            router.replace('/(app)/groups');
          } catch (error) {
            console.error(error);
            showErrorToast({ title: 'Unable to disband group', message: 'Please try again.' });
          }
        },
      },
    ]);
  };

  const handleStartSwipe = () => {
    router.push({ pathname: '/(app)/swipe', params: { groupId: groupId ?? '' } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        {group ? (
          <>
            <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
              {isEditingMeta ? (
                <View style={{ gap: spacing.sm }}>
                  <InputField label="Group Name" value={groupName} onChangeText={setGroupName} />
                  <InputField
                    label="Description"
                    value={groupDescription}
                    onChangeText={setGroupDescription}
                    placeholder="Tell your group what to expect"
                  />
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Button
                      label="Cancel"
                      variant="ghost"
                      style={{ flex: 1 }}
                      onPress={() => {
                        setIsEditingMeta(false);
                        setGroupName(group.name ?? '');
                        setGroupDescription(group.description ?? '');
                      }}
                      disabled={isSaving}
                    />
                    <Button
                      label={isSaving ? 'Saving…' : 'Save'}
                      variant="primary"
                      style={{ flex: 1 }}
                      onPress={handleSaveMeta}
                      disabled={isSaving}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <AppText variant="headline">{group.name}</AppText>
                  {group.description ? <AppText tone="secondary">{group.description}</AppText> : null}
                  <AppText tone="muted">Invite Code: {group.invite_code ?? 'Unavailable'}</AppText>
                  <Button
                    label={isGeneratingCode ? 'Generating Code...' : 'Share Invite'}
                    variant="outline"
                    onPress={handleShareInvite}
                    disabled={isGeneratingCode}
                  />
                </>
              )}
            </Surface>

            <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.md }}>
              <AppText variant="title">Search Area</AppText>
              {isCreator ? (
                <>
                  {isEditingSearch ? (
                    <View style={{ gap: spacing.md }}>
                      <InputField
                        label="Zip Code"
                        placeholder="Optional"
                        value={searchZip}
                        onChangeText={setSearchZip}
                      />
                      <InputField
                        label="Search Radius (miles)"
                        keyboardType="numeric"
                        value={searchRadius}
                        onChangeText={setSearchRadius}
                      />
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Button
                          label="Cancel"
                          variant="ghost"
                          style={{ flex: 1 }}
                          onPress={() => {
                            setIsEditingSearch(false);
                            setSearchZip(group.search_zip ?? '');
                            setSearchRadius(group.search_radius ? String(group.search_radius) : '');
                          }}
                          disabled={isSaving}
                        />
                        <Button
                          label={isSaving ? 'Saving…' : 'Save'}
                          variant="primary"
                          style={{ flex: 1 }}
                          onPress={handleSaveSearch}
                          disabled={isSaving}
                        />
                      </View>
                    </View>
                  ) : (
                    <>
                      <AppText tone="secondary">
                        Zip: {group.search_zip ?? 'Not set'} • Radius: {group.search_radius ?? '?'} miles
                      </AppText>
                      <Button label="Edit Zip & Radius" variant="outline" onPress={() => setIsEditingSearch(true)} />
                    </>
                  )}
                  <Button label="Start Swipe Session" variant="primary" onPress={handleStartSwipe} />
                </>
              ) : (
                <AppText tone="secondary">Waiting for the host to set the search radius and start swiping.</AppText>
              )}
            </Surface>

            <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
              <AppText variant="title">Members ({group.group_members.length})</AppText>
              {group.group_members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <AppText>{member.user_id}</AppText>
                  {group.created_by === member.user_id ? (
                    <AppText tone="muted">Host</AppText>
                  ) : isCreator ? (
                    <Button label="Remove" variant="ghost" size="sm" onPress={() => handleRemoveMember(member.id)} />
                  ) : null}
                </View>
              ))}
            </Surface>

            {isCreator ? (
              <Surface variant="muted" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
                <AppText variant="title">Group Settings</AppText>
                <Button label="Edit Group" variant="outline" onPress={() => setIsEditingMeta(true)} />
                <Button label="Disband Group" variant="ghost" onPress={handleDisbandGroup} />
              </Surface>
            ) : (
              <Button label="Leave Group" variant="outline" onPress={handleLeaveGroup} />
            )}
          </>
        ) : (
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText align="center">Unable to load this group. Pull to refresh or return to your groups list.</AppText>
            <Button label="Back to Groups" variant="outline" onPress={() => router.back()} />
          </Surface>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
