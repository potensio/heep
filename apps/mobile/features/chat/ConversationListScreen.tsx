import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ConversationCard } from './components/ConversationCard';
import { EmptyChatState } from './components/EmptyChatState';
import { useAuth } from '@/context/AuthContext';
import type { Conversation } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

interface ApiConversationItem {
  conversation: { id: string; updatedAt: string };
  product: { id: string; name: string; price: number; imageUrl: string | null };
  otherUser: { id: string; name: string | null; avatarUrl: string | null };
  lastMessage: { id: string; conversationId: string; senderId: string; text: string | null; imageUrl: string | null; createdAt: string; readAt: string | null } | null;
}

async function fetchConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = await res.json() as ApiConversationItem[];
  return items.map(item => ({
    id: item.conversation.id,
    otherUser: { id: item.otherUser.id, name: item.otherUser.name ?? 'Pengguna', avatar: item.otherUser.avatarUrl ?? undefined },
    product: { id: item.product.id, name: item.product.name, price: item.product.price, image: item.product.imageUrl ?? '' },
    lastMessage: item.lastMessage ? {
      id: item.lastMessage.id,
      conversationId: item.lastMessage.conversationId,
      senderId: item.lastMessage.senderId,
      text: item.lastMessage.text ?? undefined,
      image: item.lastMessage.imageUrl ?? undefined,
      timestamp: new Date(item.lastMessage.createdAt),
      isRead: !!item.lastMessage.readAt,
    } : null as any,
    unreadCount: 0,
    updatedAt: new Date(item.conversation.updatedAt),
  }));
}

export function ConversationListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetchConversations(token!),
    enabled: !!token,
  });

  const handleConversationPress = (conversation: Conversation) => {
    router.push({
      pathname: `/chat/${conversation.id}` as any,
      params: {
        sellerId: conversation.otherUser.id,
        sellerName: conversation.otherUser.name,
        productId: conversation.product.id,
        productName: conversation.product.name,
        productPrice: String(conversation.product.price),
        productImage: conversation.product.image,
      },
    });
  };

  const hasConversations = conversations.length > 0;

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top > 0 ? insets.top : 24 }}>
        {/* Header */}
        <View className="px-5 pb-4">
          <Text className="text-2xl font-heading font-medium text-neutral-900">
            Chat
          </Text>
        </View>
      </View>

      {hasConversations ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {conversations.map(conversation => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onPress={handleConversationPress}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyChatState />
      )}
    </View>
  );
}
