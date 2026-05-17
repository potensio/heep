import { Text, View } from "react-native";
import type { Order } from "@/src/types";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  // Format relative time (simplified)
  const timeDisplay = order.createdAt === 'just_now' ? 'Baru Saja' : order.createdAt;

  // Format price
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(order.totalPrice);

  return (
    <View
      className="rounded-2xl p-2"
      style={{
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.16)",
      }}
    >
      <View className="flex-row">
        {/* Product Image Placeholder */}
        <View className="w-24 h-24 bg-[#d8d8d8] rounded-[14px] mr-4" />

        {/* Order Details */}
        <View className="flex-1 justify-between py-0.5">
          {/* Order ID and Time */}
          <View className="flex-row justify-between items-center">
            <Text
              className="text-sm text-black leading-4"
              style={{ fontWeight: "600" }}
            >
              #{order.orderNumber}
            </Text>
            <Text className="text-xs text-black leading-4">
              {timeDisplay}
            </Text>
          </View>

          {/* Product Name */}
          <Text
            className="text-sm text-[#0A0A0A] leading-5"
            style={{ fontWeight: "500" }}
          >
            {order.productName}
          </Text>

          {/* Quantity and Price */}
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-black leading-4">
              {order.quantity} produk
            </Text>
            <Text
              className="text-sm text-[#0A0A0A] leading-5"
              style={{ fontWeight: "600" }}
            >
              {formattedPrice}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
