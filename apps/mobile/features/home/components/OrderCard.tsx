import { Text, View } from "react-native";

interface Order {
  orderNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  productImage?: string;
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  // Format relative time (simplified)
  const timeDisplay =
    order.createdAt === "just_now" ? "Baru Saja" : order.createdAt;

  // Format price
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(order.totalPrice);

  return (
    <View className="flex-row items-center gap-6">
      {/* Product Image Placeholder */}
      <View className="size-20 bg-gray-300 rounded-2xl" />

      {/* Order Details */}
      <View className="flex-1 gap-1.5">
        {/* Order ID and Time */}
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-semibold">#{order.orderNumber}</Text>
          <Text className="text-sm">{timeDisplay}</Text>
        </View>

        {/* Product Name */}
        <Text className="font-medium">{order.productName}</Text>

        {/* Quantity and Price */}
        <View className="flex-row justify-between items-center">
          <Text className="text-sm">{order.quantity} produk</Text>
          <Text className="text-sm font-semibold">{formattedPrice}</Text>
        </View>
      </View>
    </View>
  );
}
