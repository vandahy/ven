import { FloatingTabBar } from "@/components/FloatingTabBar";
import { Colors } from "@/constants/theme";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <MaterialTopTabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        lazyPreloadDistance: 1,
        sceneStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <MaterialTopTabs.Screen name="groups" options={{ title: "Nhóm" }} />
      <MaterialTopTabs.Screen name="index" options={{ title: "Trang chủ" }} />
      <MaterialTopTabs.Screen name="profile" options={{ title: "Tôi" }} />
    </MaterialTopTabs>
  );
}
