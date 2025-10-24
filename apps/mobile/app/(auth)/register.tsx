import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { colors, spacing, typography } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      router.replace('/(app)/(tabs)/groups');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.logo}>🍽️</Text>
              <Text style={styles.title}>Join TasteBuds</Text>
              <Text style={styles.subtitle}>Create your account to get started</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Display Name"
                placeholder="Enter your name"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errors.displayName) setErrors({ ...errors, displayName: undefined });
                }}
                error={errors.displayName}
              />

              <TextInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email}
              />

              <TextInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
                error={errors.password}
              />

              <TextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                secureTextEntry
                error={errors.confirmPassword}
              />

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/(auth)/login" style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Log in</Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  loginLink: {
    marginLeft: spacing.xs,
  },
  loginLinkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
