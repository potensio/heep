import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ConversationCard } from './components/ConversationCard';
import { EmptyChatState } from './components/EmptyChatState';
import { useAuth } from '@/context/AuthContext';
import type { Conversation } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

async function fetchConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Conversation[]>;
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
    router.push(`/chat/${conversation.id}`);
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
