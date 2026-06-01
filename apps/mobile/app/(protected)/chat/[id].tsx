import { useLocalSearchParams } from "expo-router";
import { ChatRoomScreen } from "@/features/chat/ChatRoomScreen";
import { mockConversations } from "@/features/chat/mockData";

export default function ChatRoomRoute() {
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
