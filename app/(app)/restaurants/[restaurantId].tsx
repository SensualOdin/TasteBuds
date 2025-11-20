import { fetchRestaurantDetails } from '@services';
import { supabase } from '@lib/supabase';
import { useAppTheme } from '@theme';
import { AppText, Button, Icon, Surface } from '@ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Json, Tables } from '@lib/database.types';

type Restaurant = Tables<'restaurants'>;

const { width } = Dimensions.get('window');

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

  const firstHour = hours[0];
  if (typeof firstHour === 'string') {
    const lower = firstHour.toLowerCase();
    if (lower.includes('closed')) {
      return { isOpen: false, statusText: 'Closed' };
    }
    if (lower.includes('open 24 hours') || lower.includes('open 24/7')) {
      return { isOpen: true, statusText: 'Open 24 Hours' };
    }
    return { isOpen: null, statusText: '' };
  }

  return { isOpen: null, statusText: '' };
}

function getGoogleMapsUrl(latitude: number, longitude: number, placeId?: string): string {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latitude + ',' + longitude)}`;
}

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();

  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      
      // First try to get from database
      const { data: dbRestaurant, error: dbError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();
      
      if (dbRestaurant && !dbError) {
        return dbRestaurant as Restaurant;
      }
      
      // If not in database, fetch from Google Places API
      const details = await fetchRestaurantDetails(restaurantId);
      return details;
    },
    enabled: !!restaurantId,
  });

  const handleNavigate = useCallback(() => {
    if (!restaurant) return;
    const url = getGoogleMapsUrl(restaurant.latitude, restaurant.longitude, restaurant.place_id);
    Linking.openURL(url).catch((err) => console.error('Failed to open maps:', err));
  }, [restaurant]);

  const handleCall = useCallback(() => {
    if (!restaurant?.phone) return;
    Linking.openURL(`tel:${restaurant.phone}`).catch((err) => console.error('Failed to call:', err));
  }, [restaurant]);

  const handleShare = useCallback(async () => {
    if (!restaurant) return;
    const message = `Check out ${restaurant.name}!\n${restaurant.address}\n${getGoogleMapsUrl(restaurant.latitude, restaurant.longitude, restaurant.place_id)}`;
    try {
      await Share.share({ message });
    } catch (err) {
      console.error('Failed to share:', err);
    }
  }, [restaurant]);

  const openStatus = restaurant ? getOpenStatus(restaurant.hours) : { isOpen: null, statusText: '' };

  const GOOGLE_PLACES_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
    ((globalThis as typeof globalThis & { extra?: { googlePlacesApiKey?: string } }).extra?.googlePlacesApiKey ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText align="center">Loading restaurant details...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { padding: spacing.lg, gap: spacing.lg }]}>
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText variant="headline" align="center">
              Restaurant Not Found
            </AppText>
            <AppText tone="secondary" align="center">
              {error instanceof Error ? error.message : 'Unable to load restaurant details.'}
            </AppText>
            <Button label="Go Back" variant="primary" onPress={() => router.back()} />
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  const mapImageUrl = GOOGLE_PLACES_API_KEY
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${restaurant.latitude},${restaurant.longitude}&zoom=15&size=400x200&markers=color:red%7C${restaurant.latitude},${restaurant.longitude}&key=${GOOGLE_PLACES_API_KEY}`
    : '';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: spacing.xl }]}>
        {/* Header with back button */}
        <View style={[styles.header, { padding: spacing.lg, paddingBottom: spacing.md }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" tone="default" size={24} />
          </TouchableOpacity>
          <AppText variant="title" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
            {restaurant.name}
          </AppText>
          <View style={{ width: 40 }} />
        </View>

        {/* Photo Carousel */}
        {restaurant.photo_urls && restaurant.photo_urls.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: restaurant.photo_urls[0] }}
              style={styles.headerImage}
              resizeMode="cover"
            />
            {restaurant.photo_urls.length > 1 && (
              <View style={styles.imageIndicators}>
                {restaurant.photo_urls.slice(0, 4).map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.indicator,
                      { backgroundColor: idx === 0 ? colors.textInverse : colors.textInverse + '80' },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
            <Icon name="restaurant" tone="muted" size={64} />
          </View>
        )}

        {/* Primary Info */}
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <AppText variant="headline" weight="bold">
            {restaurant.name}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
              <AppText tone="secondary">
                {restaurant.cuisine.join(' • ')} • {formatPriceLevel(restaurant.price_level)}
              </AppText>
            )}
            {(!restaurant.cuisine || restaurant.cuisine.length === 0) && (
              <AppText tone="secondary">{formatPriceLevel(restaurant.price_level)}</AppText>
            )}
          </View>
          {restaurant.rating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Icon name="star" tone="primary" size={20} />
              <AppText weight="semibold">
                {restaurant.rating.toFixed(1)}
              </AppText>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionBar, { paddingHorizontal: spacing.lg, gap: spacing.md }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleNavigate}
          >
            <Icon name="directions" tone="primary" size={24} />
            <AppText variant="caption" weight="semibold" tone="primary">
              Navigate
            </AppText>
          </TouchableOpacity>
          {restaurant.phone && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleCall}
            >
              <Icon name="phone" tone="primary" size={24} />
              <AppText variant="caption" weight="semibold" tone="primary">
                Call
              </AppText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleShare}
          >
            <Icon name="share" tone="primary" size={24} />
            <AppText variant="caption" weight="semibold" tone="primary">
              Share
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          {/* Address */}
          <View style={styles.detailRow}>
            <Icon name="place" tone="muted" size={24} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <AppText weight="semibold">{restaurant.address}</AppText>
              <TouchableOpacity onPress={handleNavigate}>
                <AppText variant="caption" tone="primary">
                  Get directions to this location
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hours */}
          {restaurant.hours && Array.isArray(restaurant.hours) && restaurant.hours.length > 0 && (
            <View style={styles.detailRow}>
              <Icon name="schedule" tone="muted" size={24} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <AppText
                  weight="semibold"
                  tone={openStatus.isOpen === true ? 'success' : openStatus.isOpen === false ? 'danger' : 'default'}
                >
                  {openStatus.statusText || 'Hours'}
                </AppText>
                {restaurant.hours
                  .filter((hour): hour is string => typeof hour === 'string')
                  .slice(0, 7)
                  .map((hour, idx) => (
                    <AppText key={idx} variant="caption" tone="secondary">
                      {hour}
                    </AppText>
                  ))}
              </View>
            </View>
          )}

          {/* Phone */}
          {restaurant.phone && (
            <TouchableOpacity style={styles.detailRow} onPress={handleCall}>
              <Icon name="phone" tone="muted" size={24} />
              <View style={{ flex: 1 }}>
                <AppText weight="semibold">{formatPhone(restaurant.phone)}</AppText>
                <AppText variant="caption" tone="primary">Tap to call</AppText>
              </View>
            </TouchableOpacity>
          )}

          {/* Website */}
          {restaurant.website && (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => Linking.openURL(restaurant.website!).catch((err) => console.error('Failed to open website:', err))}
            >
              <Icon name="link" tone="muted" size={24} />
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" numberOfLines={1}>
                  {restaurant.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </AppText>
                <AppText variant="caption" tone="primary">Visit website</AppText>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Map */}
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          <AppText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>
            Location
          </AppText>
          <TouchableOpacity onPress={handleNavigate} activeOpacity={0.9}>
            <Image
              source={{ uri: mapImageUrl }}
              style={styles.mapImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            Tap map to open in Google Maps
          </AppText>
        </View>
      </ScrollView>
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
  content: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
});

