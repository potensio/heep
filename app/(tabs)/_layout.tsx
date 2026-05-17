import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HomeIconOutline,
  HomeIconBold,
  OrderIconOutline,
  OrderIconBold,
  PlusIconBold,
  ChatIconOutline,
  ChatIconBold,
  AccountIconOutline,
  AccountIconBold,
} from "@/src/components/icons";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 72 + insets.bottom,
          paddingTop: 12,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingHorizontal: 20,
        },
        tabBarActiveTintColor: "#101828",
        tabBarInactiveTintColor: "#666666",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <HomeIconBold color="#101828" size={24} />
            ) : (
              <HomeIconOutline color="#666666" size={24} />
            ),
        }}
      />
      <Tabs.Screen
        name="pesanan"
        options={{
          title: "Pesanan",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <OrderIconBold color="#101828" size={24} />
            ) : (
              <OrderIconOutline color="#666666" size={24} />
            ),
        }}
      />
      <Tabs.Screen
        name="jual"
        options={{
          title: "Jual",
          tabBarIcon: () => (
            <View className="items-center -mt-6">
              <View
                className="w-14 h-14 bg-[#155DFC] rounded-full items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <PlusIconBold color="#FFFFFF" size={28} />
              </View>
              <Text className="text-[12px] font-medium text-black mt-1">
                Jual
              </Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ChatIconBold color="#101828" size={24} />
            ) : (
              <ChatIconOutline color="#666666" size={24} />
            ),
        }}
      />
      <Tabs.Screen
        name="akun"
        options={{
          title: "Akun",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <AccountIconBold color="#101828" size={24} />
            ) : (
              <AccountIconOutline color="#666666" size={24} />
            ),
        }}
      />
    </Tabs>
  );
}
