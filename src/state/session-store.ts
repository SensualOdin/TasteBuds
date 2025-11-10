import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SessionUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type SessionState = {
  user: SessionUser | null;
  hasCompletedOnboarding: boolean;
  setUser: (user: SessionUser | null) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  reset: () => void;
};

const initialState: Pick<SessionState, 'user' | 'hasCompletedOnboarding'> = {
  user: null,
  hasCompletedOnboarding: false,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set(() => ({ user })),
      setHasCompletedOnboarding: (value) =>
        set(() => ({ hasCompletedOnboarding: value })),
      reset: () => set(() => ({ ...initialState })),
    }),
    {
      name: 'tastebuds-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);

type PersistHelpers = {
  hasHydrated: () => boolean;
  onFinishHydration: (callback: () => void) => () => void;
};

export const sessionStorePersist = (useSessionStore as typeof useSessionStore & {
  persist: PersistHelpers;
}).persist;

