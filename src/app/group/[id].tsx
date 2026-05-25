import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Icon } from '@/components/Icon';
import {
  formatCurrency,
  totalGroupExpenses,
  roundDownTo1000,
} from '@/lib/calculate';
import { Colors, AvatarColors, FontSize, BorderRadius } from '@/constants/theme';
import { EXPENSE_CATEGORIES, CategoryIcon } from '@/components/Icon';
import type { Expense, Member, Settlement } from '@/types';
import type { PayerSummary } from '@/lib/calculate';
import { toast } from '@/lib/toast';
import { useRealtimeGroup } from '@/hooks/useRealtimeGroup';
import { shareGroupResults } from '@/lib/share';
import { shareInviteLink } from '@/lib/invite';
import { notificationSuccess, impactMedium } from '@/lib/haptics';

type Tab = 'expenses' | 'results';

function getExpenseCategory(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
  }
  return EXPENSE_CATEGORIES[Math.abs(hash) % EXPENSE_CATEGORIES.length].id;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function groupExpensesByDate(expenses: Expense[]): { date: string; items: Expense[] }[] {
  const groups: Record<string, Expense[]> = {};
  expenses.forEach((e) => {
    const key = new Date(e.created_at).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups).map(([, items]) => ({
    date: formatDate(items[0].created_at),
    items,
  }));
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    expenses,
    transactions,
    balances,
    payerSummaries,
    settlements,
    fetchExpenses,
    fetchSettlements,
    markSettled,
    computeTransactions,
    deleteExpense,
    undoSettlement,
  } = useExpenseStore();
  const { currentGroup, members, fetchGroupDetail, completeGroup, loading: groupLoading } = useGroupStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [refreshing, setRefreshing] = useState(false);

  useRealtimeGroup(id);

  const loadData = useCallback(async () => {
    if (!id) return;
    await Promise.all([fetchGroupDetail(id), fetchExpenses(id), fetchSettlements(id)]);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (members.length > 0 && expenses.length > 0) {
      computeTransactions(members);
    }
  }, [expenses, members]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMemberName = (memberId: string): string =>
    members.find((m) => m.id === memberId)?.name || '?';

  const getMemberIndex = (memberId: string): number =>
    members.findIndex((m) => m.id === memberId);

  const total = totalGroupExpenses(expenses);

  const userMember = useMemo(
    () => (user ? members.find((m) => m.user_id === user.id) : null),
    [user, members]
  );

  const userBalance = useMemo(() => {
    if (!userMember) return 0;
    return balances[userMember.id] || 0;
  }, [userMember, balances]);

  const getUserDebtForExpense = useCallback(
    (expense: Expense): number | null => {
      if (!userMember) return null;
      if (!expense.split_between.includes(userMember.id)) return null;
      if (expense.payer_id === userMember.id) return null;
      return roundDownTo1000(expense.amount / expense.split_between.length);
    },
    [userMember]
  );

  const dateGroups = useMemo(() => groupExpensesByDate(expenses), [expenses]);

  const handleMarkSettled = useCallback(async (from: string, to: string, amount: number) => {
    if (!id) return;
    Alert.alert(
      'Xác nhận thanh toán',
      `${getMemberName(from)} đã trả ${getMemberName(to)} ${formatCurrency(amount)}?`,
      [
        { text: 'Khoan đã', style: 'cancel' },
        {
          text: 'Đã trả rồi!',
          onPress: async () => {
            const success = await markSettled(id, from, to, amount);
            if (success) {
              notificationSuccess();
              toast.success('Ghi nhận rồi nha!');
            }
          },
        },
      ]
    );
  }, [id, markSettled, getMemberName]);

  const handleCompleteGroup = useCallback(() => {
    if (!id) return;
    const allSettled = transactions.length > 0 &&
      transactions.every(tx =>
        settlements.some(s => s.from_member === tx.from && s.to_member === tx.to)
      );

    if (!allSettled) {
      toast.error('Vẫn còn khoản chưa trả nè, hoàn tất hết rồi mới đóng sổ được nha~');
      return;
    }

    Alert.alert(
      'Chắc chưa nè?',
      'Sau khi đóng sổ, nhóm chi tiêu này sẽ hoàn tất và không thể thay đổi nữa nha~',
      [
        { text: 'Khoan, để xem lại', style: 'cancel' },
        {
          text: 'Đóng sổ luôn nha!',
          style: 'destructive',
          onPress: async () => {
            const success = await completeGroup(id);
            if (success) {
              toast.success('Xong xuôi hết rồi! Nhóm đã đóng sổ~');
            }
          },
        },
      ]
    );
  }, [id, transactions, settlements, completeGroup]);

  const handleUndoSettlement = useCallback((settlementId: string) => {
    if (!id) return;
    Alert.alert(
      'Hoàn tác?',
      'Bạn muốn hủy ghi nhận thanh toán này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hoàn tác',
          style: 'destructive',
          onPress: async () => {
            const success = await undoSettlement(settlementId, id);
            if (success) {
              impactMedium();
              toast.info('Đã hoàn tác ghi nhận');
            }
          },
        },
      ]
    );
  }, [id, undoSettlement]);

  const handleDeleteExpense = useCallback((expenseId: string, title: string, amount: number) => {
    if (!id) return;
    Alert.alert(
      'Xóa khoản chi?',
      `Bạn muốn xóa "${title}" (${formatCurrency(amount)})?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            impactMedium();
            deleteExpense(expenseId, id);
          },
        },
      ]
    );
  }, [id, deleteExpense]);

  const handleShare = useCallback(async () => {
    if (!currentGroup) return;
    await shareGroupResults(currentGroup.name, transactions, expenses, getMemberName);
  }, [currentGroup, transactions, expenses, getMemberName]);

  const handleInvite = useCallback(async () => {
    if (!currentGroup || !id) return;
    await shareInviteLink(currentGroup.name, id);
  }, [currentGroup, id]);

  if (groupLoading && !currentGroup) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: FontSize.xxl },
          headerShadowVisible: false,
          title: currentGroup?.name || 'Chi tiết nhóm',
          headerRight: () => (
            <View style={styles.headerRight}>
              {!currentGroup?.completed_at && (
                <Pressable onPress={handleInvite} hitSlop={8}>
                  <Icon name="link" size={20} color={Colors.primaryLight} strokeWidth={2} />
                </Pressable>
              )}
              {activeTab === 'results' && transactions.length > 0 && (
                <Pressable onPress={handleShare} hitSlop={8}>
                  <Icon name="share" size={20} color={Colors.textSecondary} strokeWidth={2} />
                </Pressable>
              )}
              <Text style={styles.headerMemberCount}>
                {members.length} thành viên
              </Text>
            </View>
          ),
        }}
      />

      {/* Tab Switcher */}
      <View style={styles.tabBarOuter}>
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
            onPress={() => setActiveTab('expenses')}
          >
            <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
              Chi tiêu
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'results' && styles.tabActive]}
            onPress={() => setActiveTab('results')}
          >
            <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
              Kết quả
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === 'expenses' ? (
        <ExpensesTab
          expenses={expenses}
          dateGroups={dateGroups}
          total={total}
          userBalance={userBalance}
          members={members}
          refreshing={refreshing}
          onRefresh={onRefresh}
          getMemberName={getMemberName}
          getMemberIndex={getMemberIndex}
          getUserDebtForExpense={getUserDebtForExpense}
          onDeleteExpense={(expenseId, title, amount) => handleDeleteExpense(expenseId, title, amount)}
          onAddExpense={() =>
            router.push({ pathname: '/expense/new', params: { groupId: id } })
          }
        />
      ) : (
        <ResultsTab
          members={members}
          balances={balances}
          transactions={transactions}
          payerSummaries={payerSummaries}
          expenses={expenses}
          settlements={settlements}
          groupCompleted={!!currentGroup?.completed_at}
          refreshing={refreshing}
          onRefresh={onRefresh}
          getMemberName={getMemberName}
          getMemberIndex={getMemberIndex}
          onMarkSettled={handleMarkSettled}
          onUndoSettlement={handleUndoSettlement}
          onCompleteGroup={handleCompleteGroup}
        />
      )}

      {/* FAB */}
      {activeTab === 'expenses' && expenses.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
          onPress={() =>
            router.push({ pathname: '/expense/new', params: { groupId: id } })
          }
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ───── Expenses Tab ───── */
function ExpensesTab({
  expenses,
  dateGroups,
  total,
  userBalance,
  members,
  refreshing,
  onRefresh,
  getMemberName,
  getMemberIndex,
  getUserDebtForExpense,
  onDeleteExpense,
  onAddExpense,
}: {
  expenses: Expense[];
  dateGroups: { date: string; items: Expense[] }[];
  total: number;
  userBalance: number;
  members: Member[];
  refreshing: boolean;
  onRefresh: () => void;
  getMemberName: (id: string) => string;
  getMemberIndex: (id: string) => number;
  getUserDebtForExpense: (e: Expense) => number | null;
  onDeleteExpense: (id: string, title: string, amount: number) => void;
  onAddExpense: () => void;
}) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        iconName="receipt"
        title="Chưa có chi tiêu"
        subtitle="Thêm khoản chi tiêu đầu tiên cho nhóm"
        actionLabel="Thêm chi tiêu"
        onAction={onAddExpense}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Summary Widget */}
      <View style={styles.summaryWidget}>
        <Text style={styles.summaryLabel}>TỔNG CHI TIÊU NHÓM</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
        {userBalance !== 0 && (
          <View
            style={[
              styles.debtBadge,
              userBalance > 0 ? styles.debtBadgePositive : styles.debtBadgeNegative,
            ]}
          >
            <Text
              style={[
                styles.debtBadgeText,
                userBalance > 0 ? styles.debtTextPositive : styles.debtTextNegative,
              ]}
            >
              {userBalance > 0
                ? `Bạn được trả ${formatCurrency(Math.abs(userBalance))}`
                : `Bạn đang nợ ${formatCurrency(Math.abs(userBalance))}`}
            </Text>
          </View>
        )}

        {/* Avatar Stack */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarStack}>
            {members.slice(0, 5).map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.miniAvatar,
                  { backgroundColor: AvatarColors[i % AvatarColors.length] },
                  i > 0 && { marginLeft: -8 },
                ]}
              >
                <Text style={styles.miniAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
              </View>
            ))}
            {members.length > 5 && (
              <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: Colors.surfaceLight }]}>
                <Text style={[styles.miniAvatarText, { fontSize: 9 }]}>+{members.length - 5}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Expense List by Date */}
      {dateGroups.map((group) => (
        <View key={group.date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{group.date}</Text>
          {group.items.map((expense) => {
            const payerIdx = getMemberIndex(expense.payer_id);
            const userDebt = getUserDebtForExpense(expense);
            return (
              <Pressable
                key={expense.id}
                style={({ pressed }) => [styles.expenseRow, pressed && { opacity: 0.7 }]}
                onLongPress={() => onDeleteExpense(expense.id, expense.title, expense.amount)}
              >
                <View style={styles.expenseIconBox}>
                  <CategoryIcon
                    category={getExpenseCategory(expense.title)}
                    size={20}
                    color={Colors.primaryLight}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle} numberOfLines={1}>
                    {expense.title}
                  </Text>
                  <View style={styles.payerRow}>
                    <View
                      style={[
                        styles.payerMiniAvatar,
                        {
                          backgroundColor:
                            AvatarColors[
                              payerIdx >= 0 ? payerIdx % AvatarColors.length : 0
                            ],
                        },
                      ]}
                    >
                      <Text style={styles.payerMiniAvatarText}>
                        {getMemberName(expense.payer_id).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.payerName}>
                      {getMemberName(expense.payer_id)} đã trả
                    </Text>
                  </View>
                </View>
                <View style={styles.expenseAmounts}>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  {userDebt !== null && (
                    <Text style={styles.expenseUserDebt}>
                      -{formatCurrency(userDebt)}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

/* ───── Results Tab ───── */
function ResultsTab({
  members,
  balances,
  transactions,
  payerSummaries,
  expenses,
  settlements,
  groupCompleted,
  refreshing,
  onRefresh,
  getMemberName,
  getMemberIndex,
  onMarkSettled,
  onUndoSettlement,
  onCompleteGroup,
}: {
  members: Member[];
  balances: Record<string, number>;
  transactions: { from: string; to: string; amount: number }[];
  payerSummaries: PayerSummary[];
  expenses: Expense[];
  settlements: Settlement[];
  groupCompleted: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  getMemberName: (id: string) => string;
  getMemberIndex: (id: string) => number;
  onMarkSettled: (from: string, to: string, amount: number) => void;
  onUndoSettlement: (settlementId: string) => void;
  onCompleteGroup: () => void;
}) {
  if (transactions.length === 0 && Object.keys(balances).length === 0) {
    return (
      <View style={styles.emptyResults}>
        <Icon name="check" size={40} color={Colors.success} strokeWidth={2} />
        <Text style={styles.emptyResultsText}>Tất cả đã cân bằng!</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Completed Banner */}
      {groupCompleted && (
        <View style={styles.completedBanner}>
          <Icon name="check" size={24} color={Colors.success} strokeWidth={2} />
          <Text style={styles.completedBannerText}>Nhóm đã đóng sổ xong xuôi rồi~</Text>
        </View>
      )}

      {/* Balance Overview */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceSectionTitle}>SỐ DƯ</Text>
        <View style={styles.balanceCard}>
          {members.map((m, i) => {
            const bal = balances[m.id] || 0;
            return (
              <View
                key={m.id}
                style={[styles.balanceRow, i < members.length - 1 && styles.balanceRowBorder]}
              >
                <View
                  style={[
                    styles.balanceAvatar,
                    { backgroundColor: AvatarColors[i % AvatarColors.length] },
                  ]}
                >
                  <Text style={styles.balanceAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.balanceName} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    bal > 0.5 && styles.balancePositive,
                    bal < -0.5 && styles.balanceNegative,
                  ]}
                >
                  {bal > 0.5 ? '+' : bal < -0.5 ? '-' : ''}
                  {formatCurrency(Math.abs(bal))}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Settlement Instructions */}
      {transactions.length > 0 && (
        <View style={styles.settlementSection}>
          <Text style={styles.balanceSectionTitle}>THANH TOÁN</Text>
          {transactions.map((tx, i) => {
            const fromIdx = getMemberIndex(tx.from);
            const toIdx = getMemberIndex(tx.to);
            const settled = groupCompleted || settlements.some(
              s => s.from_member === tx.from && s.to_member === tx.to
            );
            const settlementRecord = settlements.find(
              s => s.from_member === tx.from && s.to_member === tx.to
            );
            return (
              <View key={`${tx.from}-${tx.to}-${i}`} style={styles.settlementCard}>
                <View style={styles.settlementFlow}>
                  {/* From */}
                  <View style={styles.settlementPerson}>
                    <View
                      style={[
                        styles.settlementAvatar,
                        {
                          backgroundColor:
                            AvatarColors[fromIdx >= 0 ? fromIdx % AvatarColors.length : 0],
                        },
                      ]}
                    >
                      <Text style={styles.settlementAvatarText}>
                        {getMemberName(tx.from).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.settlementName} numberOfLines={1}>
                      {getMemberName(tx.from)}
                    </Text>
                  </View>

                  {/* Arrow + Amount */}
                  <View style={styles.settlementArrow}>
                    <Text style={styles.settlementAmountText}>
                      {formatCurrency(tx.amount)}
                    </Text>
                    <Text style={styles.arrowText}>→</Text>
                  </View>

                  {/* To */}
                  <View style={styles.settlementPerson}>
                    <View
                      style={[
                        styles.settlementAvatar,
                        {
                          backgroundColor:
                            AvatarColors[toIdx >= 0 ? toIdx % AvatarColors.length : 0],
                        },
                      ]}
                    >
                      <Text style={styles.settlementAvatarText}>
                        {getMemberName(tx.to).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.settlementName} numberOfLines={1}>
                      {getMemberName(tx.to)}
                    </Text>
                  </View>
                </View>

                <View style={styles.settlementActions}>
                  {settled ? (
                    groupCompleted || !settlementRecord ? (
                      <View style={styles.statusTagSettled}>
                        <Text style={styles.statusTagSettledText}>ĐÃ XONG</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.statusTagSettled, pressed && { opacity: 0.7 }]}
                        onPress={() => onUndoSettlement(settlementRecord.id)}
                      >
                        <Text style={styles.statusTagSettledText}>ĐÃ XONG ↩</Text>
                      </Pressable>
                    )
                  ) : (
                    <>
                      <View style={styles.statusTag}>
                        <Text style={styles.statusTagText}>CHƯA TRẢ</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.settleButton,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => onMarkSettled(tx.from, tx.to, tx.amount)}
                      >
                        <Text style={styles.settleButtonText}>Đánh dấu đã trả</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })}

          {/* Complete Group Button */}
          {!groupCompleted && (
            <Pressable
              style={({ pressed }) => [
                styles.completeGroupButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
              onPress={onCompleteGroup}
            >
              <Icon name="party-popper" size={20} color={Colors.white} strokeWidth={2} />
              <Text style={styles.completeGroupButtonText}>Đóng sổ nhóm nha~</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Payer Rounding Summary */}
      {payerSummaries.length > 0 && (
        <View style={styles.settlementSection}>
          <Text style={styles.balanceSectionTitle}>CHI TIẾT LÀM TRÒN</Text>
          {payerSummaries.map((summary) => {
            const payerIdx = getMemberIndex(summary.payerId);
            const payerName = getMemberName(summary.payerId);
            return (
              <View key={summary.payerId} style={styles.roundingSummaryCard}>
                <View style={styles.roundingSummaryHeader}>
                  <View
                    style={[
                      styles.roundingSummaryAvatar,
                      {
                        backgroundColor:
                          AvatarColors[payerIdx >= 0 ? payerIdx % AvatarColors.length : 0],
                      },
                    ]}
                  >
                    <Text style={styles.balanceAvatarText}>
                      {payerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.roundingSummaryName}>{payerName}</Text>
                </View>

                <View style={styles.roundingDetails}>
                  <View style={styles.roundingRow}>
                    <Text style={styles.roundingLabel}>Bỏ ra</Text>
                    <Text style={styles.roundingValue}>{formatCurrency(summary.totalPaid)}</Text>
                  </View>
                  <View style={styles.roundingRow}>
                    <Text style={styles.roundingLabel}>Nhận lại</Text>
                    <Text style={[styles.roundingValue, styles.balancePositive]}>
                      {formatCurrency(summary.totalReceivedBack)}
                    </Text>
                  </View>
                  <View style={[styles.roundingRow, styles.roundingRowHighlight]}>
                    <Text style={styles.roundingLabelBold}>Thực chịu</Text>
                    <Text style={[styles.roundingValueBold, styles.balanceNegative]}>
                      {formatCurrency(summary.actualCost)}
                    </Text>
                  </View>
                </View>

                <View style={styles.roundingDiffBadge}>
                  <Text style={styles.roundingDiffText}>
                    Sai lệch làm tròn: {formatCurrency(summary.roundingDiff)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

/* ───── Styles ───── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerMemberCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginRight: 4,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },

  /* Tab Bar */
  tabBarOuter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.surfaceTab,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryLight,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  /* Summary Widget */
  summaryWidget: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 20,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  summaryAmount: {
    color: Colors.textPrimary,
    fontSize: FontSize.hero,
    fontWeight: '700',
  },
  debtBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  debtBadgeNegative: {
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
  },
  debtBadgePositive: {
    backgroundColor: 'rgba(69, 223, 164, 0.1)',
  },
  debtBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  debtTextNegative: {
    color: Colors.danger,
  },
  debtTextPositive: {
    color: Colors.success,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },

  /* Expense List */
  dateGroup: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  dateHeader: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 12,
  },
  expenseIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceTab,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseIconText: {
    fontSize: 22,
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payerMiniAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payerMiniAvatarText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: '700',
  },
  payerName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  expenseAmounts: {
    alignItems: 'flex-end',
    gap: 2,
  },
  expenseAmount: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  expenseUserDebt: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },

  /* Results Tab */
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyResultsText: {
    color: Colors.success,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },

  /* Balance Section */
  balanceSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  balanceSectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  balanceCard: {
    backgroundColor: Colors.surfaceDim,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  balanceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  balanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceAvatarText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  balanceName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
  balanceAmount: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  balancePositive: {
    color: Colors.success,
  },
  balanceNegative: {
    color: Colors.danger,
  },

  /* Settlement Section */
  settlementSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  settlementCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 20,
    gap: 16,
  },
  settlementFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settlementPerson: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  settlementAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settlementAvatarText: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  settlementName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  settlementArrow: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  settlementAmountText: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  arrowText: {
    color: Colors.textMuted,
    fontSize: FontSize.xxl,
  },
  settlementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 14,
  },
  statusTag: {
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusTagText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  settleButton: {
    backgroundColor: Colors.surfaceTab,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  settleButtonText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  statusTagSettled: {
    backgroundColor: 'rgba(69, 223, 164, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusTagSettledText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(69, 223, 164, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(69, 223, 164, 0.2)',
  },
  completedBannerText: {
    color: Colors.success,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  completeGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  completeGroupButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  /* Rounding Summary */
  roundingSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
    gap: 12,
  },
  roundingSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundingSummaryAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundingSummaryName: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  roundingDetails: {
    gap: 6,
  },
  roundingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  roundingRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 8,
    marginTop: 4,
  },
  roundingLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  roundingValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  roundingLabelBold: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  roundingValueBold: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  roundingDiffBadge: {
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  roundingDiffText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 30,
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
