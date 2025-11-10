import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, Icon, Surface } from '@ui';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  {
    icon: 'groups' as const,
    title: 'Create or Join a Group',
    description: 'Start a new group and invite friends with a unique code.',
  },
  {
    icon: 'tune' as const,
    title: 'Set Your Preferences',
    description: 'Choose cuisine types, price ranges, and how far you are willing to travel.',
  },
  {
    icon: 'swipe' as const,
    title: 'Swipe on Restaurants',
    description: "Swipe right for yes and left for no until you land on spots everyone loves.",
  },
];

export default function OnboardingHowItWorksScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const setHasCompletedOnboarding = useSessionStore((state) => state.setHasCompletedOnboarding);

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(public)/login');
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skipRow}>
          <Button label="Skip" variant="ghost" size="sm" onPress={handleSkip} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="headline" align="center">
            How It Works
          </AppText>
          <AppText tone="secondary" align="center">
            Three easy steps to find a restaurant everyone will love.
          </AppText>
        </View>

        <View style={{ gap: spacing.md }}>
          {STEPS.map((step) => (
            <Surface key={step.title} variant="default" padding="lg" radius="xl" style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIcon}>
                  <Icon name={step.icon} tone="primary" size={24} />
                </View>
                <AppText variant="subtitle" weight="semibold">
                  {step.title}
                </AppText>
              </View>
              <AppText tone="muted">{step.description}</AppText>
            </Surface>
          ))}
        </View>

        <View style={styles.pagination}>
          <View style={[styles.paginationDot, { backgroundColor: `${colors.primary}33` }]} />
          <View style={[styles.paginationDot, { backgroundColor: colors.primary }]} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Button label="Continue" size="lg" onPress={completeOnboarding} />
          <Button label="Maybe Later" variant="outline" size="lg" onPress={handleSkip} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 24,
  },
  skipRow: {
    alignItems: 'flex-end',
  },
  stepCard: {
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242, 89, 13, 0.12)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
