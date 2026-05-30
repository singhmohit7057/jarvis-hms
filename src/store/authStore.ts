// #must: Zustand store for authentication state — session management, login, logout, password reset
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<() => void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone ?? '',
    role: data.role,
    avatarUrl: data.avatar_url ?? undefined,
    isActive: data.is_active ?? true,
    createdAt: data.created_at,
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const profile = await fetchProfile(session.user.id);
          set({ user: profile, isAuthenticated: !!profile, isLoading: false });
        } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          set({ user: profile, isAuthenticated: !!profile, isLoading: false });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, isAuthenticated: false, isLoading: false });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const currentUser = get().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            const profile = await fetchProfile(session.user.id);
            set({ user: profile, isAuthenticated: !!profile, isLoading: false });
          }
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return () => {};
    }
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      if (!profile) {
        throw new Error('User profile not found. Contact your administrator.');
      }
      if (!profile.isActive) {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Contact your administrator.');
      }
      set({ user: profile, isAuthenticated: true, isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new Error(error.message);
    }
  },
}));
