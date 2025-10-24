import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import type { Match } from '@/types';

export default function MatchesScreen() {
  const router = useRouter();
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [sessionId]);

  const loadMatches = async () => {
    try {
      const { matches: fetchedMatches } = await api.getMatches(sessionId!);
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMap = (restaurant: any) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      restaurant.name + ' ' + restaurant.address
    )}`;
    Linking.openURL(url);
  };

  const handleCallRestaurant = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenWebsite = (website: string) => {
    Linking.openURL(website);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.placeholder} />
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤷</Text>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptyText}>
            Keep swiping to find restaurants everyone loves!
          </Text>
          <Button
            title="Back to Swiping"
            onPress={() => router.back()}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <>
          <View style={styles.celebration}>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text style={styles.celebrationTitle}>
              {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Found!
            </Text>
            <Text style={styles.celebrationText}>
              Everyone in your group loved these restaurants
            </Text>
          </View>

          <FlatList
            data={matches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const restaurant = item.restaurants;
              if (!restaurant) return null;

              const imageUri =
                restaurant.photoUrls && restaurant.photoUrls.length > 0
                  ? restaurant.photoUrls[0]
                  : 'https://via.placeholder.com/400x300?text=No+Image';

              return (
                <View style={styles.matchCard}>
                  <Image source={{ uri: imageUri }} style={styles.matchImage} />
                  
                  <View style={styles.matchContent}>
                    <Text style={styles.matchName}>{restaurant.name}</Text>

                    {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                      <Text style={styles.matchCuisine}>
                        {restaurant.cuisine.join(' • ')}
                      </Text>
                    )}

                    <View style={styles.matchDetails}>
                      <Text style={styles.matchDetail}>
                        ⭐ {restaurant.rating.toFixed(1)}
                      </Text>
                      {restaurant.priceLevel && (
                        <Text style={styles.matchDetail}>
                          {'$'.repeat(restaurant.priceLevel)}
                        </Text>
                      )}
                      {restaurant.distance !== undefined && (
                        <Text style={styles.matchDetail}>
                          📍 {restaurant.distance.toFixed(1)} mi
                        </Text>
                      )}
                    </View>

                    {restaurant.address && (
                      <Text style={styles.matchAddress} numberOfLines={2}>
                        {restaurant.address}
                      </Text>
                    )}

                    <View style={styles.matchActions}>
                      <TouchableOpacity
                        style={styles.matchActionButton}
                        onPress={() => handleOpenMap(restaurant)}
                      >
                        <Text style={styles.matchActionText}>📍 Directions</Text>
                      </TouchableOpacity>

                      {restaurant.phone && (
                        <TouchableOpacity
                          style={styles.matchActionButton}
                          onPress={() => handleCallRestaurant(restaurant.phone!)}
                        >
                          <Text style={styles.matchActionText}>📞 Call</Text>
                        </TouchableOpacity>
                      )}

                      {restaurant.website && (
                        <TouchableOpacity
                          style={styles.matchActionButton}
                          onPress={() => handleOpenWebsite(restaurant.website!)}
                        >
                          <Text style={styles.matchActionText}>🌐 Website</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        </>
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
  headerTitle: {
    ...typography.h3,
  },
  placeholder: {
    width: 60,
  },
  celebration: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    alignItems: 'center',
  },
  celebrationIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  celebrationTitle: {
    ...typography.h2,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  celebrationText: {
    ...typography.body,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  matchImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.border.light,
  },
  matchContent: {
    padding: spacing.md,
  },
  matchName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  matchCuisine: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  matchDetails: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  matchDetail: {
    ...typography.body,
    marginRight: spacing.md,
    fontWeight: '600',
  },
  matchAddress: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  matchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  matchActionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  matchActionText: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: '600',
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
});
