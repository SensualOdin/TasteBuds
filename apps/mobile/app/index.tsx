import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return isAuthenticated ? <Redirect href="/(app)/(tabs)/groups" /> : <Redirect href="/(auth)/login" />;
}
