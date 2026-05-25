import {
  AvatarColors,
  BorderRadius,
  Colors,
  FontSize,
} from "@/constants/theme";
import { formatCurrency } from "@/lib/calculate";
import type { Member } from "@/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface GroupCardProps {
  name: string;
  members: Member[];
  expenseCount: number;
  totalAmount: number;
  userBalance: number;
  isCompleted?: boolean;
  onPress: () => void;
}

export function GroupCard({
  name,
  members,
  expenseCount,
  totalAmount,
  userBalance,
  isCompleted = false,
  onPress,
}: GroupCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCompleted && styles.cardCompleted,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.topSection}>
        <View style={styles.nameContainer}>
          <Text
            style={[styles.name, isCompleted && styles.nameCompleted]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            style={[styles.subtitle, isCompleted && styles.subtitleCompleted]}
          >
            {members.length} thành viên · {expenseCount} khoản chi
          </Text>
        </View>
        <View style={[styles.badge, isCompleted && styles.badgeCompleted]}>
          <Text
            style={[styles.badgeText, isCompleted && styles.badgeTextCompleted]}
          >
            {isCompleted ? "Xong ✓" : "Hoạt động"}
          </Text>
        </View>
      </View>

      {!isCompleted && (
        <>
          <View style={styles.avatarStack}>
            {members.slice(0, 5).map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: AvatarColors[index % AvatarColors.length],
                  },
                  index > 0 && { marginLeft: -8 },
                ]}
              >
                <Text style={styles.avatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            {members.length > 5 && (
              <View
                style={[
                  styles.avatar,
                  { marginLeft: -8, backgroundColor: Colors.surfaceLight },
                ]}
              >
                <Text style={[styles.avatarText, { fontSize: 10 }]}>
                  +{members.length - 5}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.financialLabel}>Tổng chi tiêu</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.financialLabel}>
                {userBalance >= 0 ? "Bạn được trả" : "Bạn đang nợ"}
              </Text>
              <Text
                style={[
                  styles.financialValue,
                  userBalance >= 0
                    ? styles.balancePositive
                    : styles.balanceNegative,
                ]}
              >
                {userBalance >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(userBalance))}
              </Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 16,
    gap: 5,
  },
  cardCompleted: {
    backgroundColor: Colors.surfaceDim,
    opacity: 0.75,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameContainer: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: "600",
  },
  nameCompleted: {
    color: Colors.textSecondary,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  subtitleCompleted: {
    color: Colors.textDimmed,
  },
  badge: {
    backgroundColor: Colors.badgeActiveBg,
    borderColor: Colors.badgeActiveBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  badgeCompleted: {
    backgroundColor: Colors.badgeCompletedBg,
    borderColor: Colors.badgeCompletedBorder,
  },
  badgeText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  badgeTextCompleted: {
    color: Colors.textDimmed,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 12,
  },
  footerRight: {
    alignItems: "flex-end" as const,
  },
  financialLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  financialValue: {
    color: Colors.primaryLight,
    fontSize: FontSize.xl,
    fontWeight: "700",
  },
  balancePositive: {
    color: Colors.success,
  },
  balanceNegative: {
    color: Colors.danger,
  },
});
