import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useGroupStore } from '@/store/groupStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

let instanceCounter = 0;

export function useRealtimeGroups() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(++instanceCounter);

  useEffect(() => {
    const debouncedRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        useGroupStore.getState().fetchGroups();
      }, 300);
    };

    const channel = supabase
      .channel(`user-groups-${idRef.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements' },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
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
  }, []);
}
