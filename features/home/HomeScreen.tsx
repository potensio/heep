import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SummaryCard } from "./components/SummaryCard";
import { ActionGrid } from "./components/ActionGrid";
import { BannerCarousel } from "./components/BannerCarousel";
import { OrderCard } from "./components/OrderCard";
import type { Order, OrderSummary } from "@/types";

// Mock data - will come from API/state later
const mockSummary: OrderSummary = {
  totalRevenue: 2450000,
  totalTransactions: 1234,
};

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
    <View className="flex-1 py-8">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Section */}
        <View
          className="px-5 pb-4"
          style={{ paddingTop: insets.top > 0 ? insets.top : 24 }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text
                className="text-2xl text-[#0A0A0A] leading-7 mb-0.5"
                style={{ fontWeight: "700" }}
              >
                Halo, Kak Andi! 👋
              </Text>
              <Text className="text-sm text-black leading-5">
                Yuk, lanjut Jualas hari ini!
              </Text>
            </View>
            {/* Profile Icon Placeholder */}
            <View className="w-6 h-6 bg-gray-300 rounded-full" />
          </View>
        </View>

        {/* Summary Card */}
        <View className="px-5 mb-6">
          <SummaryCard summary={mockSummary} />
        </View>

        {/* Action Buttons */}
        <View className="px-5 mb-6">
          <ActionGrid />
        </View>

        {/* Banner/Carousel Section */}
        <View className="px-5 mb-6">
          <BannerCarousel />
        </View>

        {/* New Orders Section */}
        <View className="px-5">
          {/* Section Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="text-xl text-[#0A0A0A] leading-6"
              style={{ fontWeight: "700" }}
            >
              Pesanan Baru
            </Text>
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
      </ScrollView>
    </View>
  );
}
