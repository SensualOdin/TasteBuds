import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, Icon, Surface } from '@ui';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HERO_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGRgiccKDHWOFtanftuXY2U5pmAzW_zWlomzT7vjZQCDcp98tg-JOcSgx5gksk_pmz0TWV5Uv3gble9YaPVNTuk8_Ux73_fgp4C-j3BxPW4HuLIQG3XGjLV7BU-J7HebmQYzVW5pgP0R4CF-mmggw2VlzkVsM0nGPCdwav7Cdy2Hkxnm_hCW-liPe3nGO8In7GHG8js-WEEQ62LNMD9d0WKH29SbHBG58kfC-etKSRrjcVued3efFnoRckfpddLYpESGMt5DCDAz0';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const setHasCompletedOnboarding = useSessionStore((state) => state.setHasCompletedOnboarding);

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(public)/login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable hitSlop={8} onPress={handleSkip}>
            <AppText tone="muted" weight="semibold">
              Skip
            </AppText>
          </Pressable>
        </View>

        <View style={styles.logoRow}>
          <Icon name="restaurant" tone="primary" size={28} />
          <AppText variant="subtitle" weight="semibold">
            Taste Buds
          </AppText>
        </View>

        <Surface variant="muted" padding="lg" radius="xl" style={styles.heroCard}>
          <Image source={{ uri: HERO_IMAGE_URI }} style={styles.heroImage} resizeMode="cover" />
        </Surface>

        <View style={{ gap: spacing.md }}>
          <AppText variant="headline" align="center">
            Decide Where to Eat, Together.
          </AppText>
          <AppText tone="secondary" align="center">
            The fun way for you and your friends to find the perfect restaurant. Swipe on options and see what you match!
          </AppText>
        </View>

        <View style={styles.pagination}>
          <View style={[styles.paginationDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.paginationDot, { backgroundColor: `${colors.primary}33` }]} />
        </View>

        <Button
          label="Get Started"
          size="lg"
          onPress={() => router.push('/(public)/onboarding/how-it-works')}
        />
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
  headerRow: {
    alignItems: 'flex-end',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  heroCard: {
    marginTop: 16,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 24,
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
