import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { ProductContextCard } from './components/ProductContextCard';
import { MessageBubble } from './components/MessageBubble';
import { DateSeparator } from './components/DateSeparator';
import { ChatInput } from './components/ChatInput';
import { mockMessagesByConversation, mockConversations, CURRENT_USER_ID } from './mockData';
import type { Message } from './types';

export function ChatDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const conversation = mockConversations.find(c => c.id === id);
  const [messages, setMessages] = useState<Message[]>(
    id ? mockMessagesByConversation[id] || [] : []
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  if (!conversation) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-500">Percakapan tidak ditemukan</Text>
      </View>
    );
  }

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
    setMessages(prev => [...prev, newMessage]);
  };

  const renderMessagesWithSeparators = () => {
    const elements: React.ReactNode[] = [];
    let lastDate: Date | null = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp);
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );

      if (!lastDate || messageDateOnly.getTime() !== lastDate.getTime()) {
        elements.push(
          <DateSeparator key={`sep-${message.id}`} date={messageDate} />
        );
        lastDate = messageDateOnly;
      }

      elements.push(
        <View key={message.id} className="mb-2">
          <MessageBubble
            message={message}
            isCurrentUser={message.senderId === CURRENT_USER_ID}
          />
        </View>
      );
    });

    return elements;
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-neutral-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#101828" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center">
          <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-2">
            <Text className="text-primary-500 text-sm font-semibold">
              {conversation.otherUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-base font-semibold text-neutral-900">
            {conversation.otherUser.name}
          </Text>
        </View>
      </View>

      {/* Product Context Card */}
      <ProductContextCard product={conversation.product} />

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
