import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Icon } from '@/components/Icon';
import { calculateBalances, totalGroupExpenses, formatCurrency, isGroupFullySettled } from '@/lib/calculate';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { GroupWithDetails } from '@/types';
import { useRealtimeGroups } from '@/hooks/useRealtimeGroups';

type FilterKey = 'all' | 'owing' | 'owed' | 'completed';
type SortKey = 'newest' | 'name' | 'amount' | 'members';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'owing', label: 'Đang nợ' },
  { key: 'owed', label: 'Được trả' },
  { key: 'completed', label: 'Đã đóng sổ' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'name', label: 'Tên A-Z' },
  { key: 'amount', label: 'Tổng tiền' },
  { key: 'members', label: 'Số thành viên' },
];

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, loading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useRealtimeGroups();

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const getUserBalance = useCallback(
    (group: GroupWithDetails) => {
      if (!user || !group.members?.length || !group.expenses?.length) return 0;
      const userMember = group.members.find((m) => m.user_id === user.id);
      if (!userMember) return 0;
      const balances = calculateBalances(group.members, group.expenses);
      return balances[userMember.id] || 0;
    },
    [user]
  );

  const summaryStats = useMemo(() => {
    let totalSpent = 0;
    let netBalance = 0;
    groups.forEach((g) => {
      totalSpent += totalGroupExpenses(g.expenses || []);
      if (!g.completed_at && !isGroupFullySettled(g.members || [], g.expenses || [], g.settlements || [])) {
        netBalance += getUserBalance(g);
      }
    });
    return { totalGroups: groups.length, totalSpent, netBalance };
  }, [groups, getUserBalance]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'completed') return !!g.completed_at;
      if (g.completed_at) return false;
      const balance = getUserBalance(g);
      if (activeFilter === 'owing') return balance < -0.5;
      if (activeFilter === 'owed') return balance > 0.5;
      return true;
    });
  }, [groups, activeFilter, getUserBalance]);

  const sortedGroups = useMemo(() => {
    const sorted = [...filteredGroups];
    sorted.sort((a, b) => {
      const aCompleted = a.completed_at ? 1 : 0;
      const bCompleted = b.completed_at ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;

      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name, 'vi');
        case 'amount':
          return totalGroupExpenses(b.expenses || []) - totalGroupExpenses(a.expenses || []);
        case 'members':
          return (b.members?.length || 0) - (a.members?.length || 0);
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredGroups, sortBy]);

  if (loading && groups.length === 0) {
    return <LoadingScreen />;
  }

  const renderListHeader = () => (
    <>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Icon name="users" size={16} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.statValue}>{summaryStats.totalGroups}</Text>
          <Text style={styles.statLabel}>nhóm</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Icon name="banknote" size={16} color={Colors.primaryLight} strokeWidth={2} />
          <Text style={styles.statValue}>{formatCurrency(summaryStats.totalSpent)}</Text>
          <Text style={styles.statLabel}>tổng chi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Icon
            name="trending-up"
            size={16}
            color={summaryStats.netBalance >= 0 ? Colors.success : Colors.danger}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.statValue,
              summaryStats.netBalance >= 0 ? styles.textPositive : styles.textNegative,
            ]}
          >
            {summaryStats.netBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(summaryStats.netBalance))}
          </Text>
          <Text style={styles.statLabel}>
            {summaryStats.netBalance >= 0 ? 'được trả' : 'đang nợ'}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={({ pressed }) => [styles.sortButton, pressed && { opacity: 0.7 }]}
          onPress={() => setShowSortMenu(true)}
        >
          <Icon name="arrow-up-down" size={16} color={Colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {activeFilter !== 'all' && (
        <Text style={styles.filterResultCount}>
          {sortedGroups.length} nhóm
        </Text>
      )}
    </>
  );

  const renderGroupRow = ({ item }: { item: GroupWithDetails }) => {
    const balance = getUserBalance(item);
    const isCompleted = !!item.completed_at;
    const isFullySettled = !isCompleted && isGroupFullySettled(item.members || [], item.expenses || [], item.settlements || []);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.groupRow,
          isCompleted && styles.groupRowCompleted,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => router.push(`/group/${item.id}`)}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupNameRow}>
            <Text
              style={[styles.groupName, isCompleted && styles.groupNameCompleted]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {isCompleted && (
              <View style={styles.completedTag}>
                <Text style={styles.completedTagText}>Đã xong</Text>
              </View>
            )}
            {isFullySettled && (
              <View style={styles.settledTag}>
                <Text style={styles.settledTagText}>Đã trả hết</Text>
              </View>
            )}
          </View>
          <Text style={[styles.groupMeta, isCompleted && styles.groupMetaCompleted]}>
            {item.members?.length || 0} thành viên · {formatCurrency(totalGroupExpenses(item.expenses || []))}
          </Text>
        </View>
        <View style={styles.balanceColumn}>
          {isCompleted || isFullySettled ? (
            <Icon name="check" size={18} color={Colors.success} strokeWidth={2} />
          ) : Math.abs(balance) <= 0.5 ? (
            <Text style={styles.balanceSettled}>—</Text>
          ) : (
            <Text style={[styles.balanceAmount, balance > 0 ? styles.textPositive : styles.textNegative]}>
              {balance > 0 ? '+' : '-'}{formatCurrency(Math.abs(balance))}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="users" size={24} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.headerTitle}>Nhóm</Text>
        </View>
        <Text style={styles.headerCount}>
          {groups.length > 0 ? `${groups.length} nhóm` : ''}
        </Text>
      </View>

      {groups.length === 0 ? (
        <EmptyState
          iconName="clipboard"
          title="Chưa có nhóm nào"
          subtitle="Tạo nhóm đầu tiên để bắt đầu chia tiền"
          actionLabel="Tạo nhóm mới"
          onAction={() => router.push('/group/new')}
        />
      ) : (
        <FlatList
          data={sortedGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={renderListHeader}
          renderItem={renderGroupRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyFilter}>
              <Text style={styles.emptyFilterText}>Không có nhóm nào</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={styles.sortMenu}>
            <Text style={styles.sortMenuTitle}>Sắp xếp theo</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy(opt.key);
                  setShowSortMenu(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.key && (
                  <Icon name="check" size={16} color={Colors.primary} strokeWidth={2} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.hero,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  headerCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderSubtle,
  },

  // Filter chips + sort
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterScroll: {
    flex: 1,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.badgeActiveBorder,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primaryLight,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterResultCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },

  // Group rows
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  groupInfo: {
    flex: 1,
    gap: 4,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
    flexShrink: 1,
  },
  groupNameCompleted: {
    color: Colors.textSecondary,
  },
  groupMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  groupMetaCompleted: {
    color: Colors.textDimmed,
  },
  groupRowCompleted: {
    opacity: 0.7,
  },
  completedTag: {
    backgroundColor: 'rgba(69, 223, 164, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  completedTagText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  settledTag: {
    backgroundColor: 'rgba(147, 125, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  settledTagText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  balanceColumn: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  balanceAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  balanceSettled: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  textPositive: {
    color: Colors.success,
  },
  textNegative: {
    color: Colors.danger,
  },
  separator: {
    height: Spacing.sm,
  },

  // Empty filter state
  emptyFilter: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyFilterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },

  // Sort modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sortMenu: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  sortMenuTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  sortOptionActive: {
    backgroundColor: Colors.primarySubtle,
  },
  sortOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
