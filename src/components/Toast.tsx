import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { useToastStore, type ToastItem, type ToastVariant } from '@/store/toastStore';
import { Icon, type IconName } from './Icon';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface VariantStyle {
  icon: IconName;
  iconColor: string;
  accentColor: string;
}

const VARIANT_STYLES: Record<ToastVariant, VariantStyle> = {
  success: { icon: 'check', iconColor: Colors.success, accentColor: Colors.success },
  error: { icon: 'alert', iconColor: Colors.danger, accentColor: Colors.danger },
  info: { icon: 'info', iconColor: Colors.primaryLight, accentColor: Colors.primaryLight },
};

const ENTRY_DURATION_MS = 220;
const EXIT_DURATION_MS = 180;

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const variantStyle = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRY_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRY_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: EXIT_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: variantStyle.accentColor, opacity, transform: [{ translateY }] },
      ]}
    >
      <Icon name={variantStyle.icon} size={20} color={variantStyle.iconColor} strokeWidth={2.2} />
      <Text style={styles.message} numberOfLines={3}>
        {toast.message}
      </Text>
      <Pressable
        onPress={handleDismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Đóng thông báo"
        style={styles.dismissButton}
      >
        <Icon name="close" size={16} color={Colors.textMuted} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

export function Toast() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? Spacing.lg : Spacing.xxl + Spacing.lg,
    left: Spacing.md,
    right: Spacing.md,
    gap: Spacing.sm,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: Colors.border,
    borderRightColor: Colors.border,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minWidth: 280,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 2,
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
});
