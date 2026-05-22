import { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "@solar-icons/react-native/Linear";
import { Avatar } from "@/components/ui/Avatar";
import { ProductContextCard } from "./components/ProductContextCard";
import { MessageBubble } from "./components/MessageBubble";
import { DateSeparator } from "./components/DateSeparator";
import { ChatInput } from "./components/ChatInput";
import {
  mockMessagesByConversation,
  mockConversations,
  CURRENT_USER_ID,
} from "./mockData";
import type { Message } from "./types";

export function ChatDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    productId?: string;
    productName?: string;
    productPrice?: string;
    productImage?: string;
    sellerId?: string;
    sellerName?: string;
  }>();
  const { id } = params;
  const scrollViewRef = useRef<ScrollView>(null);

  const conversation = mockConversations.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>(
    id ? mockMessagesByConversation[id] || [] : [],
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = (text: string, image?: string) => {
    const newMessage: Message = {
      id: `new-${Date.now()}`,
      conversationId: id!,
      senderId: CURRENT_USER_ID,
      text,
      image,
      timestamp: new Date(),
      isRead: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Build product context from params (for new conversations from product page)
  const productFromParams = params.productId
    ? {
        id: params.productId,
        name: params.productName || "Produk",
        price: parseInt(params.productPrice || "0", 10),
        image: params.productImage || "",
      }
    : null;

  const sellerFromParams = params.sellerId
    ? {
        id: params.sellerId,
        name: params.sellerName || "Penjual",
      }
    : null;

  if (!conversation) {
    // New conversation - use params from product page or defaults
    const newConversation = {
      id: id!,
      otherUser: sellerFromParams || { id: "seller", name: "Penjual" },
      product: productFromParams || {
        id: "p0",
        name: "Produk",
        price: 0,
        image: "",
      },
      lastMessage: null as Message | null,
      unreadCount: 0,
      updatedAt: new Date(),
    };

    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="bg-background px-4 py-3 flex-row items-center border-b border-neutral-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#101828" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center">
            <Avatar name={newConversation.otherUser.name} size="xs" />
            <Text className="text-base font-semibold text-neutral-900 ml-2">
              {newConversation.otherUser.name}
            </Text>
          </View>
        </View>

        {/* Product Context Card - show if we have product info */}
        {newConversation.product.id !== "p0" && (
          <ProductContextCard
            product={newConversation.product}
            onPress={() =>
              router.push(`/product/${newConversation.product.id}`)
            }
          />
        )}

        {/* Empty State for new chat */}
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-neutral-500 text-center">
            Mulai percakapan dengan penjual
          </Text>
        </View>

        {/* Input */}
        <ChatInput onSend={handleSend} />
      </View>
    );
  }

  const renderMessagesWithSeparators = () => {
    const elements: React.ReactNode[] = [];
    let lastDate: Date | null = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate(),
      );

      if (!lastDate || messageDateOnly.getTime() !== lastDate.getTime()) {
        elements.push(
          <DateSeparator key={`sep-${message.id}`} date={messageDate} />,
        );
        lastDate = messageDateOnly;
      }

      elements.push(
        <View key={message.id} className="mb-3">
          <MessageBubble
            message={message}
            isCurrentUser={message.senderId === CURRENT_USER_ID}
          />
        </View>,
      );
    });

    return elements;
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-background px-4 py-3 flex-row items-center border-b border-neutral-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#101828" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center">
          <Avatar
            source={conversation.otherUser.avatar}
            name={conversation.otherUser.name}
            size="xs"
          />
          <Text className="text-base font-semibold text-neutral-900 ml-2">
            {conversation.otherUser.name}
          </Text>
        </View>
      </View>

      {/* Product Context Card */}
      <ProductContextCard
        product={conversation.product}
        onPress={() => router.push(`/product/${conversation.product.id}`)}
      />

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {renderMessagesWithSeparators()}
      </ScrollView>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </View>
  );
}
