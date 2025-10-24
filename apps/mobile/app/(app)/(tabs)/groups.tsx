import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import type { Group } from '@/types';

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { groups: fetchedGroups } = await api.getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroups();
  }, []);

  const handleCreateGroup = () => {
    Alert.prompt(
      'Create Group',
      'Enter a name for your group',
      async (name) => {
        if (!name?.trim()) return;
        
        try {
          const { group } = await api.createGroup(name.trim());
          setGroups([group, ...groups]);
          Alert.alert('Success', 'Group created!');
        } catch (error) {
          Alert.alert('Error', 'Failed to create group');
        }
      }
    );
  };

  const handleJoinGroup = () => {
    Alert.prompt(
      'Join Group',
      'Enter the group ID',
      async (groupId) => {
        if (!groupId?.trim()) return;
        
        try {
          const { group } = await api.joinGroup(groupId.trim());
          setGroups([group, ...groups]);
          Alert.alert('Success', 'Joined group!');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.error || 'Failed to join group');
        }
      }
    );
  };

  const handleGroupPress = (group: Group) => {
    router.push(`/(app)/group/${group.id}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptyText}>Create a group or join an existing one to get started!</Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.groupCard}
                onPress={() => handleGroupPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupMemberCount}>
                    {item.group_members?.length || 0} members
                  </Text>
                </View>
                {item.description && (
                  <Text style={styles.groupDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.groupFooter}>
                  <Text style={styles.groupId}>ID: {item.id}</Text>
                </View>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.actions}>
          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            style={styles.actionButton}
          />
          <Button
            title="Join Group"
            onPress={handleJoinGroup}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  groupName: {
    ...typography.h3,
    flex: 1,
  },
  groupMemberCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  groupDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  groupFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  groupId: {
    ...typography.caption,
    color: colors.text.disabled,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});
