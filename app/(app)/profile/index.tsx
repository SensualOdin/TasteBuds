import { useUpdateUserProfile, useUserProfile } from '@hooks';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, InputField, Surface } from '@ui';
import { commaSeparatedToList, listToCommaSeparated } from '@utils/format';
import { showErrorToast, showToast } from '@utils/toast';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const sessionUser = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const { data: profile, isLoading } = useUserProfile(sessionUser?.id);
  const { mutateAsync: updateProfile, isPending } = useUpdateUserProfile(
    sessionUser?.id,
    sessionUser?.email ?? undefined,
  );

  const [displayName, setDisplayName] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [radius, setRadius] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDisplayName(profile.display_name ?? sessionUser?.displayName ?? sessionUser?.email ?? '');
      setCuisines(listToCommaSeparated(profile.cuisine_preferences));
      setRadius(profile.distance_preference?.toString() ?? '');
      /* eslint-enable react-hooks/set-state-in-effect */
      setMessage(null);
    } else if (sessionUser) {
      setDisplayName(sessionUser.displayName ?? sessionUser.email ?? '');
      setCuisines('');
      setRadius('');
      setMessage(null);
    }
  }, [profile, sessionUser]);

  const handleSave = async () => {
    if (!sessionUser?.id || !sessionUser.email) {
      return;
    }
    setMessage(null);
    const trimmedName = displayName.trim() || sessionUser.displayName || sessionUser.email;
    const distanceValue = radius.trim() ? Number(radius.trim()) : null;

    try {
      const updated = await updateProfile({
        displayName: trimmedName,
        cuisinePreferences: commaSeparatedToList(cuisines),
        distancePreference: distanceValue,
      });

      showToast({ title: 'Preferences updated!' });
      setUser({
        ...sessionUser,
        displayName: updated.display_name ?? trimmedName,
      });
      setDisplayName(updated.display_name ?? trimmedName);
      setRadius(updated.distance_preference?.toString() ?? (distanceValue ? String(distanceValue) : ''));
      setCuisines(listToCommaSeparated(updated.cuisine_preferences));
      setMessage('Your profile has been saved.');
    } catch (error) {
      console.error(error);
      showErrorToast({ title: 'Unable to save preferences', message: 'Please try again.' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}> 
        <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.md }}>
          <AppText variant="headline">Profile</AppText>
          <InputField label="Display Name" value={displayName} onChangeText={setDisplayName} />
          <InputField label="Email" value={sessionUser?.email ?? ''} editable={false} />
        </Surface>

        <Surface variant="default" padding="lg" radius="xl" style={{ gap: spacing.md }}>
          <AppText variant="headline">Dining Preferences</AppText>
          <InputField
            label="Favorite Cuisines"
            helperText="Comma-separated list (e.g. Italian, Sushi, Vegan)"
            value={cuisines}
            onChangeText={setCuisines}
          />
          <InputField
            label="Search Radius (miles)"
            keyboardType="numeric"
            value={radius}
            onChangeText={setRadius}
          />
          <Button
            label={isPending ? 'Saving…' : 'Save Preferences'}
            variant="primary"
            onPress={handleSave}
            disabled={isPending || isLoading}
          />
          {message ? (
            <AppText tone="muted" align="center">
              {message}
            </AppText>
          ) : null}
        </Surface>
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
    gap: 16,
  },
});
