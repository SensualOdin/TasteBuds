import { supabase } from '@lib/supabase';
import { useAppTheme } from '@theme';
import { AppText, Button, InputField } from '@ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.keyboardContainer}
      >
        <View style={[styles.content, { gap: spacing.lg }]}> 
          <View style={{ gap: spacing.sm }}>
            <AppText variant="headline">Welcome Back</AppText>
            <AppText tone="secondary">
              Log in to start swiping on restaurants with your crew.
            </AppText>
          </View>

          <View style={{ gap: spacing.md }}>
            <InputField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <InputField
              label="Password"
              placeholder="Password"
              secureTextEntry
              secureToggle
              value={password}
              onChangeText={setPassword}
            />
            {error ? (
              <AppText tone="danger" variant="caption">
                {error}
              </AppText>
            ) : null}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button label={loading ? 'Logging In…' : 'Log In'} size="lg" onPress={handleLogin} disabled={loading} />
            <Button
              label="Create Account"
              variant="outline"
              size="lg"
              onPress={() => router.push('/(public)/signup')}
              disabled={loading}
            />
          </View>

          <Button
            label="Back to Onboarding"
            variant="ghost"
            size="sm"
            onPress={() => router.replace('/(public)/onboarding')}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
});
