import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type AuthResult = { error: string | null };

const REDIRECT_PATH = 'auth/callback';

function buildRedirectUrl(): string {
  return Linking.createURL(REDIRECT_PATH);
}

function extractAuthCode(callbackUrl: string): string | null {
  const parsed = Linking.parse(callbackUrl);
  const code = parsed.queryParams?.code;
  return typeof code === 'string' ? code : null;
}

async function completeNativeOAuthFlow(
  providerUrl: string,
  redirectUrl: string
): Promise<AuthResult> {
  const result = await WebBrowser.openAuthSessionAsync(providerUrl, redirectUrl);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { error: null };
  }
  if (result.type !== 'success') {
    return { error: 'Đăng nhập bị huỷ hoặc thất bại' };
  }

  const code = extractAuthCode(result.url);
  if (!code) {
    return { error: 'Không nhận được mã xác thực từ Google' };
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return { error: error?.message ?? null };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectUrl = buildRedirectUrl();
  console.log('🔗 OAuth redirectUrl:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) return { error: error.message };
  if (!data?.url) return { error: 'Không tạo được liên kết đăng nhập' };

  if (Platform.OS === 'web') {
    window.location.assign(data.url);
    return { error: null };
  }

  return completeNativeOAuthFlow(data.url, redirectUrl);
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}
