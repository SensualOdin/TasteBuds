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

export default function SignupScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!displayName || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccessMessage('Check your inbox to confirm your email before logging in.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.keyboardContainer}
      >
        <View style={[styles.content, { gap: spacing.lg }]}> 
          <View style={{ gap: spacing.sm }}>
            <AppText variant="headline">Create Your Account</AppText>
            <AppText tone="secondary">
              Sign up to start creating groups and swiping on restaurants.
            </AppText>
          </View>

          <View style={{ gap: spacing.md }}>
            <InputField
              label="Name"
              placeholder="Jordan Smith"
              value={displayName}
              onChangeText={setDisplayName}
            />
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
            {successMessage ? (
              <AppText tone="success" variant="caption">
                {successMessage}
              </AppText>
            ) : null}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button
              label={loading ? 'Creating Account…' : 'Sign Up'}
              size="lg"
              onPress={handleSignup}
              disabled={loading}
            />
            <Button
              label="Already have an account? Log In"
              variant="outline"
              size="lg"
              onPress={() => router.push('/(public)/login')}
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
