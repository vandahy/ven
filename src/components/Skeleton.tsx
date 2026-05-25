import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}

export function Skeleton({ width, height, borderRadius = BorderRadius.sm }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: Colors.surfaceLight },
        animatedStyle,
      ]}
    />
  );
}

export function SkeletonGroupCard() {
  return (
    <View style={skeletonStyles.groupCard}>
      <View style={skeletonStyles.groupCardHeader}>
        <Skeleton width={180} height={20} />
        <Skeleton width={60} height={16} />
      </View>
      <View style={skeletonStyles.groupCardAvatars}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={28} height={28} borderRadius={14} />
        ))}
      </View>
      <View style={skeletonStyles.groupCardFooter}>
        <Skeleton width={100} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

export function SkeletonExpenseRow() {
  return (
    <View style={skeletonStyles.expenseRow}>
      <Skeleton width={48} height={48} borderRadius={BorderRadius.sm} />
      <View style={skeletonStyles.expenseInfo}>
        <Skeleton width={140} height={16} />
        <Skeleton width={100} height={12} />
      </View>
      <Skeleton width={80} height={18} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCardAvatars: {
    flexDirection: 'row',
    gap: -8,
  },
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
    gap: 6,
  },
});
