import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Expense, Member, Transaction, Settlement } from '@/types';
import { calculateBalances, minimizeTransactions, calculatePayerSummaries, PayerSummary } from '@/lib/calculate';

interface ExpenseState {
  expenses: Expense[];
  transactions: Transaction[];
  balances: Record<string, number>;
  payerSummaries: PayerSummary[];
  settlements: Settlement[];
  loading: boolean;
  error: string | null;
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (
    groupId: string,
    title: string,
    amount: number,
    payerId: string,
    splitBetween: string[]
  ) => Promise<boolean>;
  deleteExpense: (expenseId: string, groupId: string) => Promise<void>;
  computeTransactions: (members: Member[]) => void;
  fetchSettlements: (groupId: string) => Promise<void>;
  markSettled: (groupId: string, fromMember: string, toMember: string, amount: number) => Promise<boolean>;
  undoSettlement: (settlementId: string, groupId: string) => Promise<boolean>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  transactions: [],
  balances: {},
  payerSummaries: [],
  settlements: [],
  loading: false,
  error: null,

  fetchExpenses: async (groupId: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    set({ expenses: data || [], loading: false });
  },

  addExpense: async (
    groupId: string,
    title: string,
    amount: number,
    payerId: string,
    splitBetween: string[]
  ) => {
    set({ loading: true, error: null });
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      set({ error: 'Chưa đăng nhập', loading: false });
      return false;
    }

    const { error } = await supabase.from('expenses').insert({
      group_id: groupId,
      title,
      amount,
      payer_id: payerId,
      split_between: splitBetween,
      created_by: user.id,
    });

    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    await get().fetchExpenses(groupId);
    set({ loading: false });
    return true;
  },

  deleteExpense: async (expenseId: string, groupId: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      set({ error: error.message });
      return;
    }

    await get().fetchExpenses(groupId);
  },

  computeTransactions: (members: Member[]) => {
    const { expenses } = get();
    const balances = calculateBalances(members, expenses);
    const transactions = minimizeTransactions(balances);
    const payerSummaries = calculatePayerSummaries(members, expenses, transactions);
    set({ balances, transactions, payerSummaries });
  },

  fetchSettlements: async (groupId: string) => {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      set({ error: error.message });
      return;
    }
    set({ settlements: data || [] });
  },

  markSettled: async (groupId: string, fromMember: string, toMember: string, amount: number) => {
    const { error } = await supabase
      .from('settlements')
      .insert({
        group_id: groupId,
        from_member: fromMember,
        to_member: toMember,
        amount,
      });

    if (error) {
      if (error.code === '23505') {
        set({ error: 'Khoản này đã ghi nhận rồi nha~' });
      } else {
        set({ error: error.message });
      }
      return false;
    }

    await get().fetchSettlements(groupId);
    return true;
  },

  undoSettlement: async (settlementId: string, groupId: string) => {
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('id', settlementId);

    if (error) {
      set({ error: error.message });
      return false;
    }

    await get().fetchSettlements(groupId);
    return true;
  },
}));
