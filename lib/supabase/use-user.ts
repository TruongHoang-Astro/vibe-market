// lib/supabase/use-user.ts
// Hook client lấy user đang đăng nhập + profile (full_name, avatar, role).
// Tự cập nhật khi đăng nhập/đăng xuất nhờ onAuthStateChange.
'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from './client';

export interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadProfile = async (uid: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', uid)
        .maybeSingle();
      if (active) setProfile(data ? (data as unknown as Profile) : null);
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      if (data.user) loadProfile(data.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}

// Đăng xuất — xoá session + cookie. Component gọi xong nên router.refresh().
export async function signOutUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
