import { supabase } from '@lib/supabase';
import { useSessionStore } from '@state';
import { ReactNode, useEffect, useState } from 'react';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useSessionStore((state) => state.setUser);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }
      if (data.session?.user) {
        const { id, email, user_metadata } = data.session.user;
        setUser({
          id,
          email,
          displayName: user_metadata?.display_name ?? null,
          avatarUrl: user_metadata?.avatar_url ?? null,
        });
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      if (session?.user) {
        const { id, email, user_metadata } = session.user;
        setUser({
          id,
          email,
          displayName: user_metadata?.display_name ?? null,
          avatarUrl: user_metadata?.avatar_url ?? null,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser]);

  if (!isInitialized) {
    return null;
  }

  return children;
}
