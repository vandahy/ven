import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useExpenseStore } from '@/store/expenseStore';
import { useGroupStore } from '@/store/groupStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeGroup(groupId: string | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const debouncedRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        useExpenseStore.getState().fetchExpenses(groupId);
        useExpenseStore.getState().fetchSettlements(groupId);
        useGroupStore.getState().fetchGroupDetail(groupId);
      }, 300);
    };

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${groupId}` },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `group_id=eq.${groupId}` },
        debouncedRefresh
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId]);
}
