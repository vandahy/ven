import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/lib/calculate';
import { Icon } from './Icon';
import type { Expense } from '@/types';

interface ExpenseItemProps {
  expense: Expense;
  payerName: string;
  onDelete?: () => void;
}

export function ExpenseItem({
  expense,
  payerName,
  onDelete,
}: ExpenseItemProps) {
  return (
    <View style={styles.container}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {expense.title}
          </Text>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        </View>

        <View style={styles.payerRow}>
          <Icon name="wallet" size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.payer}>{payerName} đã trả</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.splitInfo}>
            Chia cho {expense.split_between.length} người
          </Text>

          {onDelete && (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deletePressed,
              ]}
            >
              <Text style={styles.deleteText}>Xoá</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  accentBar: {
    width: 3,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  amount: {
    color: Colors.secondary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  payer: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitInfo: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  deleteButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  deletePressed: {
    opacity: 0.6,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
