import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Toast } from '@/components/Toast';
import { isSetupCompleted } from '@/lib/profile';
import { Colors } from '@/constants/theme';

const AUTH_GROUP = '(auth)';
const CALLBACK_SEGMENT = 'auth';
const SETUP_SEGMENT = 'setup-profile';
const JOIN_SEGMENT = 'group';
const PENDING_JOIN_KEY = 'pending_join_group';

type RouteCheck = {
  isAuthCallback: boolean;
  isInAuthGroup: boolean;
  isSetupRoute: boolean;
  isJoinRoute: boolean;
};

function inspectRoute(segments: string[]): RouteCheck {
  return {
    isAuthCallback: segments[0] === CALLBACK_SEGMENT,
    isInAuthGroup: segments[0] === AUTH_GROUP,
    isSetupRoute: segments[0] === SETUP_SEGMENT,
    isJoinRoute: segments[0] === JOIN_SEGMENT && segments[1] === 'join',
  };
}

export default function RootLayout() {
  const { initialized, initialize, session, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    return initialize();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const { isAuthCallback, isInAuthGroup, isSetupRoute, isJoinRoute } = inspectRoute(segments as string[]);

    if (isAuthCallback) return;

    if (!session) {
      if (isJoinRoute) return;
      if (!isInAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (!isSetupCompleted(user)) {
      if (!isSetupRoute) router.replace('/setup-profile');
      return;
    }

    if (isInAuthGroup || isSetupRoute) {
      AsyncStorage.getItem(PENDING_JOIN_KEY).then((pendingGroupId) => {
        if (pendingGroupId) {
          AsyncStorage.removeItem(PENDING_JOIN_KEY);
          router.replace(`/group/join/${pendingGroupId}`);
        } else {
          router.replace('/');
        }
      });
      return;
    }
  }, [initialized, session, user, segments]);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          headerBackTitle: 'Quay lại',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="setup-profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="group/new"
          options={{
            title: 'Tạo nhóm mới',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            title: 'Chi tiết nhóm',
          }}
        />
        <Stack.Screen
          name="group/join/[id]"
          options={{
            title: 'Tham gia nhóm',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="expense/new"
          options={{
            title: 'Thêm chi tiêu',
            presentation: 'card',
          }}
        />
      </Stack>
      <Toast />
    </>
  );
}
