import React, { useEffect, useRef } from 'react';
import { Text, Pressable, View, Animated, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface MemberChipProps {
  name: string;
  isSelected: boolean;
  onToggle: () => void;
}

export function MemberChip({
  name,
  isSelected,
  onToggle,
}: MemberChipProps) {
  const animValue = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected, animValue]);

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surfaceLight, Colors.primary],
  });

  const borderColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <Pressable onPress={onToggle}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor, borderColor },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isSelected
                ? Colors.primaryDark
                : Colors.surface,
            },
          ]}
        >
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        <Text
          style={[
            styles.name,
            { color: isSelected ? Colors.textPrimary : Colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '500',
  },
});
