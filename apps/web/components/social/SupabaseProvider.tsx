'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchProfile } from '@/lib/social/api';
import { Profile } from '@/lib/social/types';

interface SocialContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue>({
  configured: false,
  loading: false,
  user: null,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      setProfile(await fetchProfile(userId));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setLoading(false);
      if (sessionUser) loadProfile(sessionUser.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) loadProfile(sessionUser.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  return (
    <SocialContext.Provider value={{ configured, loading, user, profile, signOut, refreshProfile }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  return useContext(SocialContext);
}
