import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface UserProfile {
  fullName: string | null;
  setupCompletedAt: string | null;
}

const FULL_NAME_KEY = 'full_name';
const SETUP_COMPLETED_KEY = 'setup_completed_at';

export function readProfile(user: User | null): UserProfile {
  const metadata = user?.user_metadata ?? {};
  return {
    fullName: typeof metadata[FULL_NAME_KEY] === 'string' ? metadata[FULL_NAME_KEY] : null,
    setupCompletedAt:
      typeof metadata[SETUP_COMPLETED_KEY] === 'string' ? metadata[SETUP_COMPLETED_KEY] : null,
  };
}

export function isSetupCompleted(user: User | null): boolean {
  return Boolean(readProfile(user).setupCompletedAt);
}

export async function completeProfileSetup(fullName: string): Promise<{ error: string | null }> {
  const trimmed = fullName.trim();
  if (!trimmed) return { error: 'Vui lòng nhập tên của bạn' };

  const { error } = await supabase.auth.updateUser({
    data: {
      [FULL_NAME_KEY]: trimmed,
      [SETUP_COMPLETED_KEY]: new Date().toISOString(),
    },
  });
  return { error: error?.message ?? null };
}
