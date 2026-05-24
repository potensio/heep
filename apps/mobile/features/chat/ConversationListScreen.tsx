import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ConversationCard } from './components/ConversationCard';
import { EmptyChatState } from './components/EmptyChatState';
import { mockConversations } from './mockData';
import type { Conversation } from '@/lib/types';

export function ConversationListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleConversationPress = (conversation: Conversation) => {
    router.push(`/chat/${conversation.id}`);
  };

  const hasConversations = mockConversations.length > 0;

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
          {mockConversations.map(conversation => (
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
