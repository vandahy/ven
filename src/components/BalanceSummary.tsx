import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/lib/calculate';
import { Icon } from './Icon';
import type { Transaction, Member } from '@/types';

interface BalanceSummaryProps {
  transactions: Transaction[];
  members: Member[];
}

export function BalanceSummary({
  transactions,
  members,
}: BalanceSummaryProps) {
  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      map[m.id] = m.name;
    });
    return map;
  }, [members]);

  const getMemberName = (id: string): string => {
    return memberMap[id] ?? 'Không rõ';
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="check" size={40} color={Colors.success} strokeWidth={2} />
          <Text style={styles.emptyText}>Tất cả đã cân bằng!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kết quả thanh toán</Text>

      {transactions.map((tx, index) => (
        <View key={`${tx.from}-${tx.to}-${index}`} style={styles.row}>
          <View style={styles.namesContainer}>
            <Text style={styles.fromName} numberOfLines={1}>
              {getMemberName(tx.from)}
            </Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.toName} numberOfLines={1}>
              {getMemberName(tx.to)}
            </Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(tx.amount)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  header: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  namesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    marginRight: Spacing.md,
  },
  fromName: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '600',
    flexShrink: 1,
  },
  arrow: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
  },
  toName: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: '600',
    flexShrink: 1,
  },
  amount: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.secondary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
});
