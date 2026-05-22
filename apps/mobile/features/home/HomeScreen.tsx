import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActionGrid } from "./components/ActionGrid";
import { BannerCarousel } from "./components/BannerCarousel";
import { OrderCard } from "./components/OrderCard";
import type { Order } from "@/types";
import { Bell } from "@solar-icons/react-native/Linear";

const mockOrder: Order = {
  id: "1",
  orderNumber: "SA349042",
  productName: "Pavorite Adidas A.",
  quantity: 2,
  totalPrice: 100000,
  status: "pending",
  createdAt: "just_now",
};

export function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 py-8 bg-background">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ paddingTop: insets.top > 0 ? insets.top : 24 }}
      >
        <View className="px-5 gap-6">
          {/* Header Section */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-heading font-medium mb-1">
                Halo, Kak Andi! 👋
              </Text>
              <Text className="text-sm">Yuk, lanjut jualan hari ini!</Text>
            </View>
            {/* Notification Icon */}
            <TouchableOpacity className="p-2 rounded-full active:opacity-70">
              <Bell size={24} className="text-[#0A0A0A]" />
            </TouchableOpacity>
          </View>

          {/* Banner/Carousel Section */}
          <BannerCarousel />

          {/* Action Buttons */}
          <ActionGrid />

          {/* New Orders Section */}
          <View>
            {/* Section Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-heading text-xl">Pesanan Baru</Text>
              <TouchableOpacity>
                <Text
                  className="text-sm text-black leading-4 underline"
                  style={{ fontWeight: "500" }}
                >
                  Lihat semua
                </Text>
              </TouchableOpacity>
            </View>

            {/* Order Card */}
            <OrderCard order={mockOrder} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
