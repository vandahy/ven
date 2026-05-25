import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { isSetupCompleted } from '@/lib/profile';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Colors, FontSize, Spacing } from '@/constants/theme';

const PENDING_JOIN_KEY = 'pending_join_group';

type CallbackStatus = 'exchanging' | 'success' | 'error';

async function ensureSession(code: string | undefined): Promise<{ error: string | null }> {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return { error: null };
  if (!code) return { error: 'Không tìm thấy mã xác thực' };

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return { error: error?.message ?? null };
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [status, setStatus] = useState<CallbackStatus>('exchanging');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const { error } = await ensureSession(code);
      if (cancelled) return;

      if (error) {
        setErrorMessage(error);
        setStatus('error');
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!isSetupCompleted(data.user)) {
        if (!cancelled) {
          setStatus('success');
          router.replace('/setup-profile');
        }
        return;
      }

      const pendingGroupId = await AsyncStorage.getItem(PENDING_JOIN_KEY);
      if (!cancelled) {
        setStatus('success');
        if (pendingGroupId) {
          await AsyncStorage.removeItem(PENDING_JOIN_KEY);
          router.replace(`/group/join/${pendingGroupId}`);
        } else {
          router.replace('/');
        }
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đăng nhập thất bại</Text>
        <Text style={styles.subtitle}>{errorMessage}</Text>
        <Text style={styles.action} onPress={() => router.replace('/(auth)/login')}>
          Thử lại
        </Text>
      </View>
    );
  }

  return <LoadingScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  action: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
});
