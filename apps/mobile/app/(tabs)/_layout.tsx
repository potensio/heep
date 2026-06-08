import { Tabs } from "expo-router";
import {
  SquaresFourIcon,
  ChatCircleIcon,
  BrainIcon,
  GearIcon,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: "transparent",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 70 + insets.bottom,
          paddingTop: 12,
          paddingBottom: insets.bottom || 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.foregroundMuted,
        tabBarLabelStyle: {
          fontFamily: "DM-Sans-Medium",
          fontSize: 9,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <SquaresFourIcon
              size={20}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: "Conversations",
          tabBarIcon: ({ focused, color }) => (
            <ChatCircleIcon
              size={20}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: "Knowledge",
          tabBarIcon: ({ focused, color }) => (
            <BrainIcon
              size={20}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <GearIcon
              size={20}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
