import { useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "@solar-icons/react-native/Linear";
import { Avatar } from "@/components/ui/Avatar";
import { ProductContextCard } from "./components/ProductContextCard";
import { MessageBubble } from "./components/MessageBubble";
import { DateSeparator } from "./components/DateSeparator";
import { ChatInput } from "./components/ChatInput";
import { useChatRoom } from "./hooks/useChatRoom";
import { useAuth } from "@/context/AuthContext";
import type { Conversation } from "@/lib/types";

interface ChatRoomScreenProps {
  conversation: Conversation;
}

export function ChatRoomScreen({ conversation }: ChatRoomScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const { messages, status, send } = useChatRoom(conversation.id);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const renderMessages = () => {
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
            isCurrentUser={message.senderId === user?.id}
          />
        </View>,
      );
    });

    return elements;
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
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

      {status === 'disconnected' && (
        <View className="bg-red-100 px-4 py-1 items-center">
          <Text className="text-xs text-red-600">Reconnecting...</Text>
        </View>
      )}

      <ProductContextCard
        product={conversation.product}
        onPress={() => router.push(`/product/${conversation.product.id}`)}
      />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-neutral-500 text-center">
              Mulai percakapan dengan penjual
            </Text>
          </View>
        ) : (
          renderMessages()
        )}
      </ScrollView>

      <ChatInput onSend={send} disabled={status !== 'connected'} />
    </KeyboardAvoidingView>
  );
}
