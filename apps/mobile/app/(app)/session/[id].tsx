import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { SwipeCard } from '@/components/SwipeCard';
import { Loading } from '@/components/Loading';
import { colors, spacing, typography, SCREEN_WIDTH } from '@/constants/theme';
import type { Restaurant, Match } from '@/types';

export default function SessionScreen() {
  const router = useRouter();
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const { sendSwipe, on, off } = useSocket();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    loadRestaurants();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [sessionId]);

  const setupSocketListeners = () => {
    on('match_found', handleMatchFound);
    on('session_complete', handleSessionComplete);
    on('user_swiped', handleUserSwiped);
  };

  const cleanupSocketListeners = () => {
    off('match_found', handleMatchFound);
    off('session_complete', handleSessionComplete);
    off('user_swiped', handleUserSwiped);
  };

  const loadRestaurants = async () => {
    try {
      const { restaurants: fetchedRestaurants } = await api.getRestaurants(sessionId!);
      setRestaurants(fetchedRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMatchFound = (data: { restaurant: Restaurant }) => {
    Alert.alert('🎉 Match Found!', `Everyone likes ${data.restaurant.name}!`);
    setMatches((prev) => [
      ...prev,
      {
        id: '',
        session_id: sessionId!,
        restaurant_id: data.restaurant.id,
        matched_at: new Date().toISOString(),
        restaurants: data.restaurant,
      },
    ]);
  };

  const handleSessionComplete = (data: { matches: Match[] }) => {
    Alert.alert(
      'Session Complete!',
      `You found ${data.matches.length} matches!`,
      [
        {
          text: 'View Results',
          onPress: () => router.replace(`/(app)/matches/${sessionId}`),
        },
      ]
    );
  };

  const handleUserSwiped = (data: { userId: string; restaurantId: string; direction: string }) => {
    console.log('User swiped:', data);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentRestaurant = restaurants[currentIndex];
    if (!currentRestaurant) return;

    try {
      // Send swipe to backend via API
      await api.recordSwipe(sessionId!, currentRestaurant.id, direction);
      
      // Also send via socket for real-time updates
      sendSwipe(currentRestaurant.id, direction, sessionId!);

      // Move to next card
      setCurrentIndex((prev) => prev + 1);

      // Check if we've gone through all restaurants
      if (currentIndex >= restaurants.length - 1) {
        Alert.alert(
          'All Done!',
          'You\'ve swiped on all available restaurants. Waiting for other members...',
          [
            {
              text: 'View Matches',
              onPress: () => router.replace(`/(app)/matches/${sessionId}`),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Swipe error:', error);
      Alert.alert('Error', 'Failed to record swipe');
    }
  };

  const handleManualSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  if (loading) {
    return <Loading />;
  }

  const currentRestaurant = restaurants[currentIndex];
  const nextRestaurant = restaurants[currentIndex + 1];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentIndex + 1} / {restaurants.length}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cardContainer}>
        {!currentRestaurant ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No more restaurants</Text>
            <Text style={styles.emptyText}>
              You've swiped through all available restaurants!
            </Text>
          </View>
        ) : (
          <>
            {nextRestaurant && (
              <SwipeCard
                restaurant={nextRestaurant}
                onSwipe={() => {}}
                isTop={false}
              />
            )}
            {currentRestaurant && (
              <SwipeCard
                restaurant={currentRestaurant}
                onSwipe={handleSwipe}
                isTop={true}
              />
            )}
          </>
        )}
      </View>

      {currentRestaurant && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.nopeButton]}
            onPress={() => handleManualSwipe('left')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleManualSwipe('right')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      {matches.length > 0 && (
        <TouchableOpacity
          style={styles.matchesBadge}
          onPress={() => router.push(`/(app)/matches/${sessionId}`)}
        >
          <Text style={styles.matchesBadgeText}>{matches.length} 🎉</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  headerTitle: {
    ...typography.h3,
  },
  placeholder: {
    width: 40,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  nopeButton: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  likeButton: {
    borderColor: colors.success,
    backgroundColor: colors.surface,
  },
  actionIcon: {
    fontSize: 32,
  },
  matchesBadge: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  matchesBadgeText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
});
