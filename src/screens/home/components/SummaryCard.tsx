import { Text, View } from "react-native";
import type { OrderSummary } from "@/src/types";

interface SummaryCardProps {
  summary: OrderSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  // Format currency
  const formattedRevenue = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(summary.totalRevenue);

  return (
    <View
      className="rounded-2xl p-[17px]"
      style={{
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.16)",
      }}
    >
      {/* Header with title and indicator */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-black leading-5">
          Ringkasan Toko
        </Text>
        <View className="w-4 h-4 bg-[#FB2C36] rounded-full" />
      </View>

      {/* Revenue Amount */}
      <Text
        className="text-[32px] text-[#0A0A0A] leading-8 mb-2"
        style={{ fontWeight: "700" }}
      >
        {formattedRevenue}
      </Text>

      {/* Transaction Count */}
      <Text className="text-xs text-black leading-4">
        Dari {summary.totalTransactions.toLocaleString('id-ID')} transaksi
      </Text>
    </View>
  );
}
