import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { GroupCard } from '@/components/GroupCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Icon } from '@/components/Icon';
import { calculateBalances, totalGroupExpenses } from '@/lib/calculate';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useRealtimeGroups } from '@/hooks/useRealtimeGroups';
import { SkeletonGroupCard } from '@/components/Skeleton';

export default function HomeScreen() {
  const router = useRouter();
  const { groups, loading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'bạn';

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const activeGroups = useMemo(
    () => filteredGroups.filter((g) => !g.completed_at),
    [filteredGroups]
  );

  const completedGroups = useMemo(
    () => filteredGroups.filter((g) => !!g.completed_at),
    [filteredGroups]
  );

  const getUserBalance = useCallback(
    (group: (typeof groups)[0]) => {
      if (!user || !group.members?.length || !group.expenses?.length) return 0;
      const userMember = group.members.find((m) => m.user_id === user.id);
      if (!userMember) return 0;
      const balances = calculateBalances(group.members, group.expenses);
      return balances[userMember.id] || 0;
    },
    [user]
  );

  if (loading && groups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.skeletonContent}>
          <SkeletonGroupCard />
          <SkeletonGroupCard />
          <SkeletonGroupCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Xin chào, {userName}</Text>
            <Icon name="wave" size={26} color={Colors.warning} strokeWidth={2} />
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={Colors.textMuted} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm nhóm..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {groups.length === 0 ? (
          <EmptyState
            iconName="clipboard"
            title="Chưa có nhóm nào"
            subtitle="Tạo nhóm đầu tiên để bắt đầu chia tiền cùng bạn bè"
            actionLabel="Tạo nhóm mới"
            onAction={() => router.push('/group/new')}
          />
        ) : (
          <>
            {activeGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ĐANG HOẠT ĐỘNG</Text>
                <View style={styles.cardList}>
                  {activeGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      name={group.name}
                      members={group.members || []}
                      expenseCount={group.expenses?.length || 0}
                      totalAmount={totalGroupExpenses(group.expenses || [])}
                      userBalance={getUserBalance(group)}
                      onPress={() => router.push(`/group/${group.id}`)}
                    />
                  ))}
                </View>
              </View>
            )}

            {completedGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ĐÃ ĐÓNG SỔ</Text>
                <View style={styles.cardList}>
                  {completedGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      name={group.name}
                      members={group.members || []}
                      expenseCount={group.expenses?.length || 0}
                      totalAmount={totalGroupExpenses(group.expenses || [])}
                      userBalance={getUserBalance(group)}
                      isCompleted
                      onPress={() => router.push(`/group/${group.id}`)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      {groups.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
          onPress={() => router.push('/group/new')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skeletonContent: {
    padding: 20,
    paddingTop: 80,
    gap: 16,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: FontSize.hero,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    padding: 0,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: Spacing.lg,
    gap: 16,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardList: {
    gap: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '300',
  },
});
