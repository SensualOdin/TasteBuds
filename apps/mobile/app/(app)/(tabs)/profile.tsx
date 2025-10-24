import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceCard}>
            <Text style={styles.preferenceLabel}>Price Range</Text>
            <Text style={styles.preferenceValue}>
              {'$'.repeat(user?.priceRangeMin || 1)} - {'$'.repeat(user?.priceRangeMax || 4)}
            </Text>
          </View>

          <View style={styles.preferenceCard}>
            <Text style={styles.preferenceLabel}>Search Radius</Text>
            <Text style={styles.preferenceValue}>
              {((user?.distancePreference || 5000) / 1000).toFixed(1)} km
            </Text>
          </View>

          {user?.cuisinePreferences && user.cuisinePreferences.length > 0 && (
            <View style={styles.preferenceCard}>
              <Text style={styles.preferenceLabel}>Cuisine Preferences</Text>
              <Text style={styles.preferenceValue}>
                {user.cuisinePreferences.join(', ')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.infoText}>
            Member since {new Date(user?.createdAt || '').toLocaleDateString()}
          </Text>
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  displayName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.bodySmall,
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
  preferenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  preferenceLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  preferenceValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});
