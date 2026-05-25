import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle as signInWithGoogleProvider, signOut as signOutProvider, type AuthResult } from '@/lib/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

function applySession(session: Session | null) {
  return {
    session,
    user: session?.user ?? null,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signInWithGoogle: async () => {
    set({ loading: true });
    const result = await signInWithGoogleProvider();
    set({ loading: false });
    return result;
  },

  signOut: async () => {
    await signOutProvider();
  },

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ ...applySession(session), initialized: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      set(applySession(session));
    });

    return () => listener.subscription.unsubscribe();
  },
}));
