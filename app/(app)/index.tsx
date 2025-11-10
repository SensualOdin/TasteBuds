import { supabase } from '@lib/supabase';
import { useAppTheme } from '@theme';
import { AppText, Button } from '@ui';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppHomeRedirect() {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const router = useRouter();

  useEffect(() => {
    router.replace('/(app)/groups');
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={[styles.content, { gap: spacing.md }]}> 
        <ActivityIndicator color={colors.primary} />
        <AppText tone="secondary">Loading your groups…</AppText>
        <Button label="Sign Out" variant="ghost" size="sm" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
