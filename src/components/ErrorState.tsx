import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon } from '@/components/Icon';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = 'Có lỗi xảy ra, vui lòng thử lại',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="alert" size={32} color={Colors.danger} strokeWidth={2} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}
        onPress={onRetry}
      >
        <Text style={styles.retryText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  retryText: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
});
