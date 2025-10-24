import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import type { Group } from '@/types';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { joinSession, isConnected } = useSocket();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    try {
      const { group: fetchedGroup } = await api.getGroup(id!);
      setGroup(fetchedGroup);
    } catch (error) {
      Alert.alert('Error', 'Failed to load group');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      setStartingSession(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find restaurants');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Start session on backend
      const { session } = await api.startSession({
        groupId: id!,
        locationLat: latitude,
        locationLng: longitude,
        searchRadius: 5000, // 5km default
        priceRangeMin: 1,
        priceRangeMax: 4,
      });

      // Join socket session
      if (isConnected) {
        joinSession(id!);
      }

      // Navigate to session screen
      router.push(`/(app)/session/${session.id}`);
    } catch (error: any) {
      console.error('Start session error:', error);
      Alert.alert('Error', error.message || 'Failed to start session');
    } finally {
      setStartingSession(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.leaveGroup(id!);
              Alert.alert('Success', 'You left the group');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (!group) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({group.group_members?.length || 0})</Text>
          {group.group_members?.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.users.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.users.display_name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group ID</Text>
          <Text style={styles.groupId}>{group.id}</Text>
          <Text style={styles.groupIdHint}>
            Share this ID with friends so they can join
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Start Swiping Session"
          onPress={handleStartSession}
          loading={startingSession}
          style={styles.actionButton}
        />
        <Button
          title="Leave Group"
          onPress={handleLeaveGroup}
          variant="outline"
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  groupHeader: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  groupName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  groupDescription: {
    ...typography.body,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  memberAvatarText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.body,
    fontWeight: '600',
  },
  memberRole: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  groupId: {
    ...typography.body,
    fontFamily: 'monospace',
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  groupIdHint: {
    ...typography.caption,
    color: colors.text.secondary,
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
