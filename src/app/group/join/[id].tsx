import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { Icon } from '@/components/Icon';
import { toast } from '@/lib/toast';
import { Colors, FontSize, BorderRadius, AvatarColors, Spacing } from '@/constants/theme';

const PENDING_JOIN_KEY = 'pending_join_group';

interface InviteMember {
  id: string;
  name: string;
  has_user: boolean;
}

interface InviteInfo {
  group_name: string;
  member_count: number;
  members: InviteMember[];
}

export default function JoinGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { linkMember, joinGroupAsNewMember } = useGroupStore();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchInviteInfo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_group_invite_info', {
      p_group_id: id,
    });

    if (rpcError) {
      setError('Nhóm không tồn tại hoặc link đã hết hạn');
      setLoading(false);
      return;
    }

    setInfo(data as InviteInfo);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInviteInfo();
  }, [fetchInviteInfo]);

  const handleLogin = async () => {
    if (id) {
      await AsyncStorage.setItem(PENDING_JOIN_KEY, id);
    }
    router.push('/(auth)/login');
  };

  const handleClaimMember = async (memberId: string) => {
    if (!id) return;
    setJoining(true);
    const success = await linkMember(memberId, id);
    setJoining(false);
    if (success) {
      toast.success('Tham gia nhóm thành công!');
      router.replace(`/group/${id}`);
    } else {
      toast.error('Không thể tham gia nhóm');
    }
  };

  const handleJoinAsNew = async () => {
    if (!id || !newName.trim()) return;
    setJoining(true);
    const success = await joinGroupAsNewMember(id, newName.trim());
    setJoining(false);
    if (success) {
      toast.success('Tham gia nhóm thành công!');
      router.replace(`/group/${id}`);
    } else {
      toast.error('Không thể tham gia nhóm');
    }
  };

  const unlinkedMembers = info?.members.filter((m) => !m.has_user) || [];

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
            headerShadowVisible: false,
            title: 'Tham gia nhóm',
          }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin nhóm...</Text>
        </View>
      </View>
    );
  }

  if (error || !info) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
            headerShadowVisible: false,
            title: 'Tham gia nhóm',
          }}
        />
        <View style={styles.centered}>
          <Icon name="alert" size={48} color={Colors.danger} strokeWidth={2} />
          <Text style={styles.errorText}>{error || 'Có lỗi xảy ra'}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
            headerShadowVisible: false,
            title: 'Tham gia nhóm',
          }}
        />
        <View style={styles.content}>
          <View style={styles.groupInfo}>
            <View style={styles.groupIcon}>
              <Icon name="users" size={32} color={Colors.primaryLight} strokeWidth={2} />
            </View>
            <Text style={styles.groupName}>{info.group_name}</Text>
            <Text style={styles.groupMeta}>{info.member_count} thành viên</Text>
          </View>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Đăng nhập để tham gia nhóm này
            </Text>
            <Pressable
              style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Đăng nhập với Google</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          title: 'Tham gia nhóm',
        }}
      />

      <View style={styles.content}>
        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupIcon}>
            <Icon name="users" size={32} color={Colors.primaryLight} strokeWidth={2} />
          </View>
          <Text style={styles.groupName}>{info.group_name}</Text>
          <Text style={styles.groupMeta}>{info.member_count} thành viên</Text>
        </View>

        {/* Claim Existing Member */}
        {unlinkedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CHỌN TÊN CỦA BẠN</Text>
            <Text style={styles.sectionSubtitle}>
              Chọn tên mà nhóm đã thêm sẵn cho bạn
            </Text>
            {unlinkedMembers.map((member, i) => (
              <Pressable
                key={member.id}
                style={({ pressed }) => [
                  styles.memberOption,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  Alert.alert(
                    'Xác nhận',
                    `Bạn là "${member.name}" phải không?`,
                    [
                      { text: 'Không', style: 'cancel' },
                      { text: 'Đúng rồi!', onPress: () => handleClaimMember(member.id) },
                    ]
                  );
                }}
                disabled={joining}
              >
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: AvatarColors[i % AvatarColors.length] },
                  ]}
                >
                  <Text style={styles.memberAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Icon name="chevron-right" size={16} color={Colors.textMuted} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Join as New */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {unlinkedMembers.length > 0 ? 'HOẶC THÊM TÊN MỚI' : 'NHẬP TÊN CỦA BẠN'}
          </Text>
          {showNameInput ? (
            <View style={styles.nameInputRow}>
              <TextInput
                style={styles.nameInput}
                placeholder="Tên của bạn"
                placeholderTextColor={Colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                maxLength={50}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [
                  styles.joinButton,
                  pressed && { opacity: 0.8 },
                  (!newName.trim() || joining) && { opacity: 0.5 },
                ]}
                onPress={handleJoinAsNew}
                disabled={!newName.trim() || joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.joinButtonText}>Tham gia</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.addNewButton, pressed && { opacity: 0.7 }]}
              onPress={() => setShowNameInput(true)}
            >
              <Icon name="plus" size={20} color={Colors.primaryLight} strokeWidth={2} />
              <Text style={styles.addNewButtonText}>Thêm tôi vào nhóm</Text>
            </Pressable>
          )}
        </View>
      </View>

      {joining && (
        <View style={styles.joiningOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.joiningText}>Đang tham gia nhóm...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: Spacing.xl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  retryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  groupInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 12,
  },
  groupIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  groupMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: Colors.textDimmed,
    fontSize: FontSize.md,
    marginTop: -4,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  memberName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
  nameInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
  },
  addNewButtonText: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  loginPrompt: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  loginPromptText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  joiningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  joiningText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
});
