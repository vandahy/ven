import { Share } from 'react-native';
import { formatCurrency, totalGroupExpenses } from './calculate';
import type { Transaction, Expense } from '@/types';

export function generateGroupSummaryText(
  groupName: string,
  transactions: Transaction[],
  expenses: Expense[],
  getMemberName: (id: string) => string
): string {
  const lines: string[] = [];
  lines.push(`🧾 Nhóm "${groupName}" — Kết quả`);
  lines.push('');

  if (transactions.length === 0) {
    lines.push('Tất cả đã cân bằng!');
  } else {
    transactions.forEach((tx) => {
      lines.push(
        `${getMemberName(tx.from)} → ${getMemberName(tx.to)}: ${formatCurrency(tx.amount)}`
      );
    });
  }

  lines.push('');
  lines.push(`Tổng chi tiêu: ${formatCurrency(totalGroupExpenses(expenses))}`);
  lines.push('Chia qua app Vén');

  return lines.join('\n');
}

export async function shareGroupResults(
  groupName: string,
  transactions: Transaction[],
  expenses: Expense[],
  getMemberName: (id: string) => string
): Promise<void> {
  const text = generateGroupSummaryText(groupName, transactions, expenses, getMemberName);
  await Share.share({ message: text });
}
