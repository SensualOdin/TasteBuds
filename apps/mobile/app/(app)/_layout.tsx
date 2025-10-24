import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="group/[id]" />
      <Stack.Screen name="session/[id]" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="matches/[id]" />
    </Stack>
  );
}
