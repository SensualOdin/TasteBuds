import { useGroups, useNearbyRestaurants, useSaveRestaurants } from '@hooks';
import { Json } from '@lib/database.types';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, Icon, Surface } from '@ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
/* eslint-disable import/default */
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
/* eslint-enable import/default */
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.55;
const SWIPE_THRESHOLD = width * 0.3;
const MIN_SWIPE_VELOCITY = 500;

function formatPriceLevel(level: number | null): string {
  if (level === null) return '?';
  return '$'.repeat(Math.min(level, 4));
}

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

function getOpenStatus(hours: Json | null): { isOpen: boolean | null; statusText: string } {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return { isOpen: null, statusText: '' };
  }

  // Try to parse the first hour entry
  const firstHour = hours[0];
  if (typeof firstHour === 'string') {
    // Format: "Monday: 11:00 AM – 10:00 PM"
    const lower = firstHour.toLowerCase();
    if (lower.includes('closed')) {
      return { isOpen: false, statusText: 'Closed' };
    }
    if (lower.includes('open 24 hours') || lower.includes('open 24/7')) {
      return { isOpen: true, statusText: 'Open 24 Hours' };
    }
    // Simple check - if it contains "open" or times, assume it might be open
    // This is a basic check, full parsing would be more complex
    return { isOpen: null, statusText: '' };
  }

  return { isOpen: null, statusText: '' };
}

export default function SwipeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const user = useSessionStore((state) => state.user);
  const { data: groups = [] } = useGroups(user?.id);
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);

  const { data: restaurants = [], isLoading, error, refetch } = useNearbyRestaurants({
    zipCode: group?.search_zip ?? undefined,
    radiusMiles: group?.search_radius ?? undefined,
    enabled: Boolean(group?.search_zip && group?.search_radius),
  });

  const { mutateAsync: saveRestaurants } = useSaveRestaurants();

  useEffect(() => {
    if (restaurants.length > 0) {
      saveRestaurants(restaurants).catch((err) => {
        console.warn('Failed to save restaurants to database:', err);
      });
    }
  }, [restaurants, saveRestaurants]);

  const restaurant = useMemo(() => restaurants[index], [restaurants, index]);

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      console.log('Swiped', direction, restaurant?.name);
      setIndex((prev) => Math.min(prev + 1, restaurants.length));
    },
    [restaurants.length, restaurant],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(15)
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .onUpdate((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY * 0.3;
          rotate.value = event.translationX / 25;
        })
        .onEnd((event) => {
          const absX = Math.abs(event.translationX);
          const absVelocityX = Math.abs(event.velocityX);
          const shouldDismiss =
            absX > SWIPE_THRESHOLD || (absX > width * 0.15 && absVelocityX > MIN_SWIPE_VELOCITY);

          if (shouldDismiss) {
            const direction = event.translationX > 0 ? 'right' : 'left';
            const targetX = Math.sign(event.translationX) * width * 1.5;
            translateX.value = withSpring(targetX, { damping: 15, stiffness: 100 }, () => {
              // Reset values in the animation callback (runs on UI thread)
              translateX.value = 0;
              translateY.value = 0;
              rotate.value = 0;
              runOnJS(handleSwipeComplete)(direction as 'left' | 'right');
            });
            translateY.value = withSpring(event.translationY * 0.3, { damping: 15 });
            rotate.value = withSpring(event.translationX / 15, { damping: 15 });
          } else {
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
            rotate.value = withSpring(0, { damping: 20, stiffness: 200 });
          }
        })
        .runOnJS(true),
    [handleSwipeComplete, rotate, translateX, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (!groupId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}>
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText variant="headline" align="center">
              No Group Selected
            </AppText>
            <AppText tone="secondary" align="center">
              Create or join a group and set search preferences to start swiping.
            </AppText>
            <Button label="Go to Groups" variant="primary" onPress={() => router.push('/(app)/groups')} />
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  if (!group?.search_zip || !group?.search_radius) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}>
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText variant="headline" align="center">
              Search Not Configured
            </AppText>
            <AppText tone="secondary" align="center">
              The group host needs to set a zip code and search radius before you can swipe.
            </AppText>
            <Button label="Back to Group" variant="primary" onPress={() => router.back()} />
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}>
          <AppText variant="headline">Finding Restaurants...</AppText>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText tone="secondary" align="center">
            Searching within {group.search_radius} miles of {group.search_zip}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}>
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText variant="headline" align="center">
              Unable to Load Restaurants
            </AppText>
            <AppText tone="secondary" align="center">
              {error instanceof Error ? error.message : 'Please check your Google Places API key and try again.'}
            </AppText>
            <Button label="Retry" variant="primary" onPress={() => refetch()} />
            <Button label="Back to Group" variant="outline" onPress={() => router.back()} />
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}> 
        <AppText variant="headline">Swipe Restaurants</AppText>
        <AppText tone="secondary">
          {group.name} • {restaurants.length} found
        </AppText>
        <View style={styles.deckContainer}>
          {restaurant ? (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.card, animatedStyle]}>
                <Surface variant="default" padding="none" radius="xl" style={styles.cardSurface}>
                  {restaurant.photo_urls && restaurant.photo_urls.length > 0 ? (
                    <Image
                      source={{ uri: restaurant.photo_urls[0] }}
                      style={styles.restaurantImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.restaurantImage, styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
                      <Icon name="restaurant" tone="muted" size={64} />
                    </View>
                  )}
                  <ScrollView
                    style={styles.cardContent}
                    contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                  >
                    {/* Header Section */}
                    <View style={{ gap: spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
                        <View style={{ flex: 1, gap: spacing.xs }}>
                          <AppText variant="title" weight="bold" style={{ fontSize: 24 }}>
                            {restaurant.name}
                          </AppText>
                          {restaurant.cuisine && restaurant.cuisine.length > 0 ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                              {restaurant.cuisine.map((cuisine, idx) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.cuisineBadge,
                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                  ]}
                                >
                                  <AppText variant="caption" weight="semibold" tone="secondary">
                                    {cuisine}
                                  </AppText>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                        {restaurant.rating && restaurant.rating >= 4.5 ? (
                          <View
                            style={[
                              styles.popularBadge,
                              { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                            ]}
                          >
                            <Icon name="local-fire-department" tone="primary" size={16} />
                            <AppText variant="caption" weight="bold" tone="primary">
                              Popular
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                      {restaurant.rating ? (
                        <View style={styles.statItem}>
                          <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Icon name="star" tone="primary" size={20} />
                          </View>
                          <View>
                            <AppText variant="body" weight="bold">
                              {restaurant.rating.toFixed(1)}
                            </AppText>
                            <AppText variant="caption" tone="muted">
                              Rating
                            </AppText>
                          </View>
                        </View>
                      ) : null}
                      <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                          <Icon name="payments" tone="default" size={20} />
                        </View>
                        <View>
                          <AppText variant="body" weight="bold">
                            {formatPriceLevel(restaurant.price_level)}
                          </AppText>
                          <AppText variant="caption" tone="muted">
                            Price
                          </AppText>
                        </View>
                      </View>
                    </View>

                    {/* Open Status */}
                    {(() => {
                      const openStatus = getOpenStatus(restaurant.hours);
                      if (openStatus.statusText) {
                        return (
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  openStatus.isOpen === true
                                    ? colors.success + '20'
                                    : openStatus.isOpen === false
                                      ? colors.danger + '20'
                                      : colors.surface,
                                borderColor:
                                  openStatus.isOpen === true
                                    ? colors.success
                                    : openStatus.isOpen === false
                                      ? colors.danger
                                      : colors.border,
                              },
                            ]}
                          >
                            <Icon
                              name={openStatus.isOpen === true ? 'check-circle' : 'cancel'}
                              tone={openStatus.isOpen === true ? 'success' : openStatus.isOpen === false ? 'danger' : 'muted'}
                              size={16}
                            />
                            <AppText
                              variant="caption"
                              weight="semibold"
                              tone={openStatus.isOpen === true ? 'success' : openStatus.isOpen === false ? 'danger' : 'muted'}
                            >
                              {openStatus.statusText}
                            </AppText>
                          </View>
                        );
                      }
                      return null;
                    })()}

                    {/* Address */}
                    {restaurant.address ? (
                      <View style={styles.infoRow}>
                        <Icon name="place" tone="muted" size={20} />
                        <AppText tone="muted" variant="body" style={{ flex: 1, lineHeight: 20 }}>
                          {restaurant.address}
                        </AppText>
                      </View>
                    ) : null}

                    {/* Contact Section */}
                    {(restaurant.phone || restaurant.website) && (
                      <View style={{ gap: spacing.xs }}>
                        <AppText variant="caption" weight="semibold" tone="muted" style={{ marginBottom: spacing.xs }}>
                          Contact
                        </AppText>
                        {restaurant.phone ? (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
                            activeOpacity={0.7}
                          >
                            <Icon name="phone" tone="primary" size={18} />
                            <AppText tone="primary" variant="body" weight="semibold" style={{ flex: 1 }}>
                              {formatPhone(restaurant.phone)}
                            </AppText>
                            <Icon name="chevron-right" tone="muted" size={18} />
                          </TouchableOpacity>
                        ) : null}
                        {restaurant.website ? (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => Linking.openURL(restaurant.website!)}
                            activeOpacity={0.7}
                          >
                            <Icon name="link" tone="primary" size={18} />
                            <AppText tone="primary" variant="body" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
                              Visit Website
                            </AppText>
                            <Icon name="chevron-right" tone="muted" size={18} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    )}

                    {/* Hours Section */}
                    {restaurant.hours && Array.isArray(restaurant.hours) && restaurant.hours.length > 0 ? (
                      <View style={{ gap: spacing.xs }}>
                        <AppText variant="caption" weight="semibold" tone="muted" style={{ marginBottom: spacing.xs }}>
                          Operating Hours
                        </AppText>
                        <View style={[styles.hoursContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          {restaurant.hours
                            .slice(0, 7)
                            .filter((hour): hour is string => typeof hour === 'string')
                            .map((hour, idx) => (
                              <View key={idx} style={styles.hourRow}>
                                <AppText tone="muted" variant="caption" style={{ minWidth: 80 }}>
                                  {hour.split(':')[0]}
                                </AppText>
                                <AppText tone="secondary" variant="caption" style={{ flex: 1 }}>
                                  {hour.split(':').slice(1).join(':').trim()}
                                </AppText>
                              </View>
                            ))}
                        </View>
                      </View>
                    ) : null}
                  </ScrollView>
                </Surface>
              </Animated.View>
            </GestureDetector>
          ) : (
            <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
              <AppText variant="headline" align="center">
                No more restaurants
              </AppText>
              <AppText tone="secondary" align="center">
                You&apos;ve swiped through all available restaurants. Adjust your filters or search area to find more.
              </AppText>
              <Button label="Back to Group" variant="primary" onPress={() => router.back()} />
            </Surface>
          )}
        </View>
        <View style={styles.actionsRow}>
          <Button
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            contentStyle={{ gap: 12 }}
            leadingIcon={<Icon name="close" tone="default" size={28} />}
            onPress={() => handleSwipeComplete('left')}
            disabled={!restaurant}
          >
            <AppText>Skip</AppText>
          </Button>
          <Button
            variant="primary"
            size="lg"
            style={{ flex: 1 }}
            contentStyle={{ gap: 12 }}
            leadingIcon={<Icon name="favorite" tone="inverse" size={28} />}
            onPress={() => handleSwipeComplete('right')}
            disabled={!restaurant}
          >
            <AppText tone="inverse">Like</AppText>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardSurface: {
    flex: 1,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: CARD_HEIGHT * 0.5,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cuisineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  hoursContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
});
