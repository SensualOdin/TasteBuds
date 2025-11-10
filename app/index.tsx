import { sessionStorePersist, useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Icon } from '@ui';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexScreen() {
  const { theme, colorMode } = useAppTheme();
  const { colors, spacing } = theme;
  const router = useRouter();
  const hasCompletedOnboarding = useSessionStore((state) => state.hasCompletedOnboarding);
  const user = useSessionStore((state) => state.user);
  const [isHydrated, setIsHydrated] = useState(() => sessionStorePersist.hasHydrated());
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isHydrated) {
      return;
    }

    const unsubscribe = sessionStorePersist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => unsubscribe?.();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated || hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;

    if (user) {
      router.replace('/(app)');
      return;
    }

    if (!hasCompletedOnboarding) {
      router.replace('/(public)/onboarding');
      return;
    }

    router.replace('/(public)/login');
  }, [hasCompletedOnboarding, isHydrated, router, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.brand}>
        <Icon name="restaurant" tone="primary" size={48} />
        <AppText variant="headline" align="center" style={{ marginTop: spacing.sm }}>
          Taste Buds
        </AppText>
        <AppText tone="muted" align="center" style={{ marginTop: spacing.xs }}>
          Getting things ready for a delicious experience…
        </AppText>
      </View>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  brand: {
    alignItems: 'center',
    gap: 12,
  },
});

