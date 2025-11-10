import { useMatches } from '@hooks';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, Surface } from '@ui';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_SESSION_ID = 'demo-session-id';

export default function MatchesScreen() {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const user = useSessionStore((state) => state.user);
  const { data: matches = [], isLoading } = useMatches(user ? MOCK_SESSION_ID : undefined);

  const topThree = matches.slice(0, 3);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}> 
        <AppText variant="headline">Matched Restaurants</AppText>

        {isLoading ? (
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText align="center">Loading matches…</AppText>
          </Surface>
        ) : topThree.length ? (
          topThree.map((match) => (
            <Surface key={match.id} variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
              <AppText variant="title">{match.restaurants.name}</AppText>
              <AppText tone="secondary">{match.restaurants.address}</AppText>
              <Button label="View Details" variant="outline" />
            </Surface>
          ))
        ) : (
          <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
            <AppText variant="headline" align="center">
              No matches yet
            </AppText>
            <AppText tone="secondary" align="center">
              Start a swipe session with your group to see the top picks here.
            </AppText>
            <Button label="Start Swiping" size="lg" style={{ marginTop: spacing.lg }} />
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
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
});
