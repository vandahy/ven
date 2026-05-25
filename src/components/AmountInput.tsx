import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface AmountInputProps {
  value: number;
  onChange: (amount: number) => void;
}

/**
 * Format number with dots: 1500000 → "1.500.000"
 */
function formatWithDots(num: number): string {
  if (num === 0) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function AmountInput({ value, onChange }: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    value > 0 ? formatWithDots(value) : ''
  );

  // Sync display when value prop changes externally
  useEffect(() => {
    const formatted = value > 0 ? formatWithDots(value) : '';
    setDisplayValue(formatted);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      // Strip all non-digit characters
      const digitsOnly = text.replace(/[^\d]/g, '');
      const numericValue = parseInt(digitsOnly, 10) || 0;

      // Format display
      setDisplayValue(numericValue > 0 ? formatWithDots(numericValue) : '');

      // Emit raw number
      onChange(numericValue);
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={displayValue}
        onChangeText={handleChangeText}
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
        selectionColor={Colors.primary}
      />
      <View style={styles.suffixContainer}>
        <Text style={styles.suffix}>đ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  suffixContainer: {
    marginLeft: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderLeftColor: Colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  suffix: {
    color: Colors.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
});
