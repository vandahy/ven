import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { useExpenseStore } from '@/store/expenseStore';
import { toast } from '@/lib/toast';
import { notificationSuccess } from '@/lib/haptics';
import { Colors, AvatarColors, FontSize, BorderRadius } from '@/constants/theme';

const MAX_TITLE_LENGTH = 80;

function formatWithDots(num: number): string {
  if (num === 0) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function NewExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { members, fetchGroupDetail } = useGroupStore();
  const { addExpense, loading } = useExpenseStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [payerId, setPayerId] = useState<string>('');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);

  useEffect(() => {
    if (groupId && members.length === 0) {
      fetchGroupDetail(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (members.length > 0) {
      setSplitBetween(members.map((m) => m.id));
      if (!payerId) setPayerId(members[0].id);
    }
  }, [members]);

  const splitPercent = useMemo(() => {
    if (splitBetween.length === 0) return 0;
    return Math.round(100 / splitBetween.length);
  }, [splitBetween]);

  const toggleMember = (memberId: string) => {
    setSplitBetween((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/[^\d]/g, '');
    const numericValue = parseInt(digitsOnly, 10) || 0;
    setDisplayAmount(numericValue > 0 ? formatWithDots(numericValue) : '');
    setAmount(numericValue);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên khoản chi');
      return;
    }
    if (amount <= 0) {
      toast.error('Vui lòng nhập số tiền');
      return;
    }
    if (!payerId) {
      toast.error('Vui lòng chọn người trả');
      return;
    }
    if (splitBetween.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 người để chia');
      return;
    }

    const success = await addExpense(groupId!, title.trim(), amount, payerId, splitBetween);
    if (!success) {
      toast.error('Không thể lưu khoản chi, vui lòng thử lại');
      return;
    }
    toast.success('Đã thêm khoản chi');
    notificationSuccess();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen
        options={{
          title: 'Thêm chi tiêu',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '600', fontSize: FontSize.xxl },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Số tiền</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={displayAmount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              selectionColor={Colors.primaryLight}
            />
            <Text style={styles.amountSuffix}>đ</Text>
          </View>
          <View style={styles.amountDivider} />
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Expense Name */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldIcon}>✏️</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Tên chi tiêu"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldDivider} />

          {/* Payer Selection */}
          <View style={styles.payerSection}>
            <Text style={styles.payerLabel}>Người trả</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payerScroll}>
              <View style={styles.payerList}>
                {members.map((member, index) => {
                  const isSelected = payerId === member.id;
                  return (
                    <Pressable
                      key={member.id}
                      style={styles.payerItem}
                      onPress={() => setPayerId(member.id)}
                    >
                      <View
                        style={[
                          styles.payerAvatar,
                          {
                            backgroundColor: isSelected
                              ? Colors.primaryLight
                              : AvatarColors[index % AvatarColors.length],
                            opacity: isSelected ? 1 : 0.6,
                          },
                          isSelected && styles.payerAvatarSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.payerAvatarText,
                            isSelected && styles.payerAvatarTextSelected,
                          ]}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.payerName,
                          isSelected && styles.payerNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {member.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Split Section */}
        <View style={styles.splitSection}>
          <View style={styles.splitHeader}>
            <Text style={styles.splitTitle}>Chia cho</Text>
            <Text style={styles.splitMode}>Chia đều</Text>
          </View>

          {members.map((member, index) => {
            const isSelected = splitBetween.includes(member.id);
            return (
              <Pressable
                key={member.id}
                style={styles.splitRow}
                onPress={() => toggleMember(member.id)}
              >
                <View
                  style={[
                    styles.splitAvatar,
                    { backgroundColor: AvatarColors[index % AvatarColors.length] },
                  ]}
                >
                  <Text style={styles.splitAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.splitName} numberOfLines={1}>
                  {member.name}
                </Text>
                <Text style={styles.splitPercent}>
                  {isSelected ? `${splitPercent}%` : '—'}
                </Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            loading && { opacity: 0.5 },
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.saveButtonContent}>
              <ActivityIndicator size="small" color="#31009A" />
              <Text style={styles.saveText}>Đang lưu...</Text>
            </View>
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  /* Amount */
  amountSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  amountLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountInput: {
    color: Colors.primaryLight,
    fontSize: FontSize.hero,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
  },
  amountSuffix: {
    color: Colors.primaryLight,
    fontSize: FontSize.hero,
    fontWeight: '700',
    marginLeft: 4,
  },
  amountDivider: {
    width: 120,
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginTop: 16,
  },

  /* Form */
  formSection: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(26, 29, 38, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldIcon: {
    fontSize: 18,
  },
  fieldInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    padding: 0,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 16,
  },

  /* Payer */
  payerSection: {
    gap: 12,
  },
  payerLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  payerScroll: {
    marginHorizontal: -4,
  },
  payerList: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  payerItem: {
    alignItems: 'center',
    gap: 6,
    width: 60,
  },
  payerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payerAvatarSelected: {
    shadowColor: Colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  payerAvatarText: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  payerAvatarTextSelected: {
    color: '#31009A',
  },
  payerName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  payerNameSelected: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },

  /* Split */
  splitSection: {
    marginTop: 24,
    marginHorizontal: 20,
    gap: 4,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  splitMode: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  splitAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitAvatarText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  splitName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  splitPercent: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  checkmark: {
    color: '#31009A',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: Colors.background,
  },
  saveButton: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveText: {
    color: '#31009A',
    fontSize: FontSize.xxl,
    fontWeight: '600',
  },
  saveButtonContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
});
