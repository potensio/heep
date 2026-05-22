import { Text, View } from "react-native";
import { Eye } from "@solar-icons/react-native/Linear";
import type { StoreStats } from "@/types";

interface SummaryCardProps {
  stats: StoreStats;
}

export function SummaryCard({ stats }: SummaryCardProps) {
  // Mock view data for last 7 days
  const viewData = [45, 62, 38, 75, 55, 89, stats.productViews % 100 || 92];
  const maxValue = Math.max(...viewData);

  return (
    <View>
      {/* Header with Icon */}
      <View className="flex-row items-center gap-2 mb-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: "#3B82F615" }}
        >
          <Eye size={18} color="#3B82F6" />
        </View>
        <View>
          <Text
            className="text-2xl text-[#0A0A0A]"
            style={{ fontWeight: "700" }}
          >
            {stats.productViews.toLocaleString('id-ID')}
          </Text>
          <Text className="text-xs text-gray-500 leading-4">
            Total Dilihat
          </Text>
        </View>
      </View>

      {/* Mini Bar Chart */}
      <View className="flex-row items-end justify-between h-10 gap-1">
        {viewData.map((value, index) => {
          const heightPercent = (value / maxValue) * 100;
          const isLast = index === viewData.length - 1;

          return (
            <View
              key={index}
              className="flex-1 rounded-t"
              style={{
                height: `${Math.max(heightPercent, 15)}%`,
                backgroundColor: isLast ? "#3B82F6" : "#E5E7EB",
              }}
            />
          );
        })}
      </View>

      {/* X-axis labels */}
      <View className="flex-row justify-between mt-2">
        <Text className="text-[10px] text-gray-400">7 hari lalu</Text>
        <Text className="text-[10px] text-gray-400">Hari ini</Text>
      </View>
    </View>
  );
}
