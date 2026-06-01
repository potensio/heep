import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChatRoomScreen } from "@/features/chat/ChatRoomScreen";
import { mockConversations } from "@/features/chat/mockData";
import { useAuth } from "@/context/AuthContext";

export default function ChatRoomRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, sellerId, sellerName, productId, productName, productPrice, productImage } =
    useLocalSearchParams<{
      id: string;
      sellerId?: string;
      sellerName?: string;
      productId?: string;
      productName?: string;
      productPrice?: string;
      productImage?: string;
    }>();

  // Prevent user from chatting with themselves
  if (sellerId && user?.id === sellerId) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-neutral-500 text-center">
          Anda tidak dapat berchat dengan diri sendiri
        </Text>
      </View>
    );
  }

  const conversation = mockConversations.find((c) => c.id === id) ?? {
    id,
    otherUser: {
      id: sellerId ?? "seller",
      name: sellerName ?? "Penjual",
    },
    product: {
      id: productId ?? "",
      name: productName ?? "Produk",
      price: parseInt(productPrice ?? "0", 10),
      image: productImage ?? "",
    },
    lastMessage: null as any,
    unreadCount: 0,
    updatedAt: new Date(),
  };

  return (
    <ChatRoomScreen
      conversation={conversation}
    />
  );
}
