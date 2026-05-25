import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { readProfile } from '@/lib/profile';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const APP_VERSION = '1.1.0 (V1)';

function formatJoinDate(timestamp: string | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { fullName } = readProfile(user);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Đã đăng xuất');
  };

  const displayName = fullName ?? user?.email ?? 'Người dùng';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.joinDate}>Tham gia từ {formatJoinDate(user?.created_at)}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Icon name="user" size={20} color={Colors.primaryLight} strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.email ?? '—'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Icon name="check" size={20} color={Colors.success} strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Xác thực</Text>
            <Text style={styles.infoValue}>Google</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Về ứng dụng</Text>
        <View style={styles.infoCard}>
          <Icon name="info" size={20} color={Colors.textSecondary} strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phiên bản</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleSignOut}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
      >
        <Icon name="close" size={18} color={Colors.danger} strokeWidth={2.2} />
        <Text style={styles.signOutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  displayName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  joinDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    marginTop: 'auto',
    marginBottom: Spacing.xxxl,
  },
  signOutPressed: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.danger,
  },
});
