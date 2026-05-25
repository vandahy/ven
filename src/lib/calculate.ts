import { Member, Expense, Transaction, Settlement } from '@/types';

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

export function parseCurrency(str: string): number {
  return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
}

export function roundDownTo1000(amount: number): number {
  return Math.floor(amount / 1000) * 1000;
}

export function calculateBalances(
  members: Member[],
  expenses: Expense[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.id] = 0));

  expenses.forEach((expense) => {
    const share = roundDownTo1000(expense.amount / expense.split_between.length);
    const roundedTotal = share * expense.split_between.length;
    balances[expense.payer_id] += roundedTotal;
    expense.split_between.forEach((memberId) => {
      balances[memberId] -= share;
    });
  });

  return balances;
}

export function minimizeTransactions(
  balances: Record<string, number>
): Transaction[] {
  const transactions: Transaction[] = [];

  const creditors: [string, number][] = [];
  const debtors: [string, number][] = [];

  Object.entries(balances).forEach(([id, bal]) => {
    if (bal > 0.5) creditors.push([id, bal]);
    if (bal < -0.5) debtors.push([id, -bal]);
  });

  creditors.sort((a, b) => b[1] - a[1]);
  debtors.sort((a, b) => b[1] - a[1]);

  let i = 0,
    j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i][1], debtors[j][1]);
    const roundedAmount = roundDownTo1000(amount);

    if (roundedAmount > 0) {
      transactions.push({
        from: debtors[j][0],
        to: creditors[i][0],
        amount: roundedAmount,
      });
    }

    creditors[i][1] -= amount;
    debtors[j][1] -= amount;

    if (creditors[i][1] < 0.5) i++;
    if (debtors[j][1] < 0.5) j++;
  }

  return transactions;
}

export interface PayerSummary {
  payerId: string;
  totalPaid: number;
  totalReceivedBack: number;
  actualCost: number;
  exactFairShare: number;
  roundingDiff: number;
}

export function calculatePayerSummaries(
  members: Member[],
  expenses: Expense[],
  transactions: Transaction[]
): PayerSummary[] {
  const exactShares: Record<string, number> = {};
  const totalPaid: Record<string, number> = {};
  members.forEach((m) => {
    exactShares[m.id] = 0;
    totalPaid[m.id] = 0;
  });

  expenses.forEach((expense) => {
    totalPaid[expense.payer_id] = (totalPaid[expense.payer_id] || 0) + expense.amount;
    const exactShare = expense.amount / expense.split_between.length;
    expense.split_between.forEach((memberId) => {
      exactShares[memberId] = (exactShares[memberId] || 0) + exactShare;
    });
  });

  const receivedBack: Record<string, number> = {};
  transactions.forEach((tx) => {
    receivedBack[tx.to] = (receivedBack[tx.to] || 0) + tx.amount;
  });

  const summaries: PayerSummary[] = [];
  members.forEach((m) => {
    const paid = totalPaid[m.id] || 0;
    if (paid <= 0) return;

    const received = receivedBack[m.id] || 0;
    const actualCost = paid - received;
    const exactFair = exactShares[m.id] || 0;
    const diff = Math.round(actualCost - exactFair);

    if (diff > 0) {
      summaries.push({
        payerId: m.id,
        totalPaid: paid,
        totalReceivedBack: received,
        actualCost,
        exactFairShare: exactFair,
        roundingDiff: diff,
      });
    }
  });

  return summaries;
}

export function totalGroupExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function isGroupFullySettled(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): boolean {
  if (!members.length || !expenses.length) return false;
  const balances = calculateBalances(members, expenses);
  const transactions = minimizeTransactions(balances);
  if (transactions.length === 0) return false;
  return transactions.every(tx =>
    settlements.some(s => s.from_member === tx.from && s.to_member === tx.to)
  );
}
