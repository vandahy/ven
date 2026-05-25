import { BorderRadius, Colors } from "@/constants/theme";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { Home, User, Users } from "lucide-react-native";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS = [Home, Users, User] as const;
const PILL_WIDTH = 180;
const PILL_HEIGHT = 56;
const INDICATOR_SIZE = 44;

export function FloatingTabBar({
  state,
  navigation,
  position,
}: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabWidth = PILL_WIDTH / state.routes.length;
  const inputRange = state.routes.map((_, i) => i);

  const indicatorTranslateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map(
      (i) => i * tabWidth + (tabWidth - INDICATOR_SIZE) / 2,
    ),
  });

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <Animated.View
          style={[
            styles.indicator,
            { transform: [{ translateX: indicatorTranslateX }] },
          ]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const TabIcon = TAB_ICONS[index];

          const animatedOpacity = position.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tabButton}
            >
              <Animated.View style={{ opacity: animatedOpacity }}>
                <TabIcon
                  size={22}
                  color={Colors.white}
                  strokeWidth={focused ? 2.4 : 1.8}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(40, 42, 48, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  indicator: {
    position: "absolute",
    top: (PILL_HEIGHT - INDICATOR_SIZE) / 2,
    left: 0,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: "rgba(147, 125, 255, 0.35)",
  },
  tabButton: {
    flex: 1,
    height: PILL_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
