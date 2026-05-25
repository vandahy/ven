import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Group, Member, GroupWithDetails } from '@/types';

interface GroupState {
  groups: GroupWithDetails[];
  currentGroup: Group | null;
  members: Member[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, memberNames: string[]) => Promise<string | null>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  addMember: (groupId: string, name: string) => Promise<void>;
  completeGroup: (groupId: string) => Promise<boolean>;
  linkMember: (memberId: string, groupId: string) => Promise<boolean>;
  joinGroupAsNewMember: (groupId: string, name: string) => Promise<boolean>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  members: [],
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('groups')
      .select('*, members(*), expenses(*), settlements(*)')
      .order('created_at', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    set({ groups: (data || []) as GroupWithDetails[], loading: false });
  },

  createGroup: async (name: string, memberNames: string[]) => {
    set({ loading: true, error: null });
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      set({ error: 'Chưa đăng nhập', loading: false });
      return null;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (groupError || !group) {
      set({ error: groupError?.message || 'Lỗi tạo nhóm', loading: false });
      return null;
    }

    const membersToInsert = [
      { group_id: group.id, name: user.email?.split('@')[0] || 'Tôi', user_id: user.id },
      ...memberNames.map((n) => ({ group_id: group.id, name: n, user_id: null })),
    ];

    const { error: membersError } = await supabase
      .from('members')
      .insert(membersToInsert);

    if (membersError) {
      set({ error: membersError.message, loading: false });
      return null;
    }

    await get().fetchGroups();
    set({ loading: false });
    return group.id;
  },

  fetchGroupDetail: async (groupId: string) => {
    set({ loading: true, error: null });

    const [groupRes, membersRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('members').select('*').eq('group_id', groupId).order('created_at'),
    ]);

    if (groupRes.error) {
      set({ error: groupRes.error.message, loading: false });
      return;
    }

    set({
      currentGroup: groupRes.data,
      members: membersRes.data || [],
      loading: false,
    });
  },

  addMember: async (groupId: string, name: string) => {
    const { error } = await supabase
      .from('members')
      .insert({ group_id: groupId, name, user_id: null });

    if (error) {
      set({ error: error.message });
      return;
    }

    await get().fetchGroupDetail(groupId);
  },

  completeGroup: async (groupId: string) => {
    const { error } = await supabase.rpc('complete_group', { p_group_id: groupId });

    if (error) {
      set({ error: error.message });
      return false;
    }

    await get().fetchGroupDetail(groupId);
    return true;
  },

  linkMember: async (memberId: string, groupId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      set({ error: 'Chưa đăng nhập' });
      return false;
    }

    const { data, error } = await supabase.rpc('claim_member_slot', {
      p_member_id: memberId,
      p_group_id: groupId,
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    if (!data) {
      set({ error: 'Không thể liên kết thành viên này' });
      return false;
    }

    await get().fetchGroups();
    return true;
  },

  joinGroupAsNewMember: async (groupId: string, name: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      set({ error: 'Chưa đăng nhập' });
      return false;
    }

    const { data, error } = await supabase.rpc('join_group_as_new_member', {
      p_group_id: groupId,
      p_name: name,
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    if (!data) {
      set({ error: 'Nhóm không tồn tại' });
      return false;
    }

    await get().fetchGroups();
    return true;
  },
}));
