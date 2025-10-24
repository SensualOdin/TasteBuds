import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius, shadows, SCREEN_WIDTH } from '@/constants/theme';
import type { Restaurant } from '@/types';

const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_MULTIPLIER = 20;

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}

export function SwipeCard({ restaurant, onSwipe, isTop }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isTop ? 1 : 0.95);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        translateX.value = withSpring(
          translateX.value > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { velocity: 2000 },
          () => runOnJS(onSwipe)(direction)
        );
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_MULTIPLIER, 0, ROTATION_MULTIPLIER]
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
        { scale: scale.value },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1]
    );
    return { opacity };
  });

  const nopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    );
    return { opacity };
  });

  const imageUri = restaurant.photoUrls && restaurant.photoUrls.length > 0
    ? restaurant.photoUrls[0]
    : 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        <Animated.View style={[styles.overlay, styles.likeOverlay, likeStyle]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>

        <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeStyle]}>
          <Text style={styles.overlayText}>NOPE</Text>
        </Animated.View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          
          <View style={styles.tags}>
            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
              <Text style={styles.cuisine} numberOfLines={1}>
                {restaurant.cuisine.join(' • ')}
              </Text>
            )}
          </View>

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>⭐</Text>
              <Text style={styles.detailText}>{restaurant.rating.toFixed(1)}</Text>
            </View>

            {restaurant.priceLevel && (
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>
                  {'$'.repeat(restaurant.priceLevel)}
                </Text>
              </View>
            )}

            {restaurant.distance !== undefined && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>
                  {restaurant.distance.toFixed(1)} mi
                </Text>
              </View>
            )}
          </View>

          {restaurant.address && (
            <Text style={styles.address} numberOfLines={1}>
              {restaurant.address}
            </Text>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: 600,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '70%',
    backgroundColor: colors.border.light,
  },
  overlay: {
    position: 'absolute',
    top: 40,
    padding: spacing.md,
    borderWidth: 4,
    borderRadius: borderRadius.md,
    transform: [{ rotate: '-15deg' }],
  },
  likeOverlay: {
    right: 40,
    borderColor: colors.success,
  },
  nopeOverlay: {
    left: 40,
    borderColor: colors.danger,
    transform: [{ rotate: '15deg' }],
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  info: {
    padding: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  cuisine: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  detailText: {
    ...typography.body,
    fontWeight: '600',
  },
  address: {
    ...typography.caption,
    color: colors.text.disabled,
  },
});
