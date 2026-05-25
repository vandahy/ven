import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { Icon } from '@/components/Icon';
import { toast } from '@/lib/toast';
import { notificationSuccess } from '@/lib/haptics';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const MAX_GROUP_NAME = 60;
const MAX_MEMBER_NAME = 50;

export default function NewGroupScreen() {
  const router = useRouter();
  const { createGroup, loading } = useGroupStore();
  const [groupName, setGroupName] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>(['']);

  const addMemberField = () => {
    setMemberNames([...memberNames, '']);
  };

  const updateMember = (index: number, name: string) => {
    const updated = [...memberNames];
    updated[index] = name;
    setMemberNames(updated);
  };

  const removeMember = (index: number) => {
    if (memberNames.length === 1) return;
    setMemberNames(memberNames.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    if (trimmedName.length < 2) {
      toast.error('Tên nhóm cần ít nhất 2 ký tự');
      return;
    }

    const validMembers = memberNames.map((n) => n.trim()).filter(Boolean);
    if (validMembers.length === 0) {
      toast.error('Vui lòng nhập tên ít nhất 1 thành viên');
      return;
    }

    const uniqueMembers = Array.from(new Set(validMembers));
    if (uniqueMembers.length !== validMembers.length) {
      toast.error('Tên thành viên không được trùng nhau');
      return;
    }

    const groupId = await createGroup(trimmedName, uniqueMembers);
    if (!groupId) {
      toast.error('Tạo nhóm thất bại, vui lòng thử lại');
      return;
    }
    toast.success(`Đã tạo nhóm "${trimmedName}"`);
    notificationSuccess();
    router.replace(`/group/${groupId}`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Tên nhóm</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Du lịch Đà Lạt"
            placeholderTextColor={Colors.textMuted}
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
            maxLength={MAX_GROUP_NAME}
            returnKeyType="next"
          />
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.label}>Thành viên</Text>
          <View style={styles.hintRow}>
            <Icon name="wallet" size={14} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.hint}>Bạn sẽ được tự động thêm vào nhóm</Text>
          </View>

          {memberNames.map((name, index) => (
            <View key={index} style={styles.memberRow}>
              <View style={styles.memberIndex}>
                <Text style={styles.memberIndexText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.memberInput}
                placeholder={`Tên thành viên ${index + 1}`}
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={(text) => updateMember(index, text)}
                maxLength={MAX_MEMBER_NAME}
                autoCapitalize="words"
              />
              {memberNames.length > 1 && (
                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeMember(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.addMemberButton,
              pressed && styles.addMemberPressed,
            ]}
            onPress={addMemberField}
          >
            <Text style={styles.addMemberText}>Thêm thành viên</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createPressed,
            loading && styles.createDisabled,
          ]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createText}>
            {loading ? 'Đang tạo...' : 'Tạo nhóm'}
          </Text>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  label: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  memberIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  memberIndexText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  memberInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  removeButtonText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '600',
  },
  addMemberButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  addMemberPressed: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  addMemberText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl + 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  createDisabled: {
    opacity: 0.6,
  },
  createText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
