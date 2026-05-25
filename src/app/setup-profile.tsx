import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { completeProfileSetup, readProfile } from '@/lib/profile';
import { toast } from '@/lib/toast';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function SetupProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const { fullName: existing } = readProfile(user);
    if (existing) setFullName(existing);
  }, [user]);

  const handleContinue = async () => {
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }
    setIsSaving(true);
    const { error } = await completeProfileSetup(fullName);
    setIsSaving(false);

    if (error) {
      toast.error(`Không thể lưu: ${error}`);
      return;
    }
    toast.success('Chào mừng bạn đến với Vén!');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Chào mừng đến với Vén</Text>
          <Text style={styles.subtitle}>
            Bạn muốn được gọi là gì? Tên này sẽ hiển thị với các thành viên trong nhóm.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Tên hiển thị</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Minh Anh"
            placeholderTextColor={Colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            maxLength={50}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isSaving || !fullName.trim()}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              (isSaving || !fullName.trim()) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {isSaving ? 'Đang lưu...' : 'Tiếp tục'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.hero,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.lg,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as const, userSelect: 'none' as const },
      default: {},
    }),
  },
  buttonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
