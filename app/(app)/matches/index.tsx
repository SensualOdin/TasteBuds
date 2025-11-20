import { useMatchHistory } from '@hooks';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, Surface } from '@ui';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatchesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const user = useSessionStore((state) => state.user);
  const { data: matches = [], isLoading } = useMatchHistory(user?.id);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (matches.length > 0 && !isLoading) {
      confettiRef.current?.start();
    }
  }, [matches.length, isLoading]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}>
        <AppText variant="headline">Matched Restaurants</AppText>
        {matches.length > 0 && (
          <AppText tone="secondary">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </AppText>
        )}

        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            {[1, 2, 3].map((i) => (
              <Surface key={i} variant="muted" padding="lg" radius="xl" style={{ height: 120, justifyContent: 'center' }}>
                <AppText tone="muted" align="center">Loading...</AppText>
              </Surface>
            ))}
          </View>
        ) : matches.length ? (
          <View style={{ gap: spacing.md }}>
            {matches.map((match, index) => (
              <Animated.View key={match.id} entering={FadeInDown.delay(index * 100).springify()}>
                <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
                  <AppText variant="title">{match.restaurants.name}</AppText>
                  <AppText tone="secondary">{match.restaurants.address}</AppText>
                  <Button
                    label="View Details"
                    variant="outline"
                    onPress={() => router.push(`/(app)/restaurants/${match.restaurants.id}`)}
                  />
                </Surface>
              </Animated.View>
            ))}
          </View>
        ) : (
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText variant="headline" align="center">
              No matches yet
            </AppText>
            <AppText tone="secondary" align="center">
              Start a swipe session with your group to see the top picks here.
            </AppText>
            <Button
              label="Start Swiping"
              size="lg"
              style={{ marginTop: spacing.lg }}
              onPress={() => router.push('/(app)/groups')}
            />
          </Surface>
        )}
      </ScrollView>
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
});
