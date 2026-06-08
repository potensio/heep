import React, { memo, useCallback } from 'react';
import { Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeftIcon, UserIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { List } from '@/components/ui/list';
import { ChannelIcon } from '../components/channel-icon';
import type { Conversation, ConversationListResponse, Message } from '../types';

type MessageBubbleProps = { message: Message };

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isAgent = message.is_from_agent;
  const time = message.sent_at
    ? new Date(message.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box className={`px-4 mb-2 ${isAgent ? 'items-end' : 'items-start'}`}>
      <Box
        className={`rounded-[20px] px-4 py-3 max-w-[78%] ${isAgent ? 'bg-[#4A6660]' : 'bg-white'}`}
        style={{
          borderBottomRightRadius: isAgent ? 4 : 20,
          borderBottomLeftRadius: isAgent ? 20 : 4,
        }}
      >
        <Text className={`text-sm leading-5 ${isAgent ? 'text-white' : 'text-foreground'}`}>
          {message.text}
        </Text>
      </Box>
      <Text className="text-muted text-xs mt-1 px-1">{time}</Text>
    </Box>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const cached = queryClient.getQueryData<InfiniteData<ConversationListResponse>>(['conversations']);
  const conversation: Conversation | undefined = cached?.pages
    .flatMap((p) => p.data)
    .find((c) => c.id === id);

  const messages = conversation?.messages ?? [];

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background-muted"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <HStack className="items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <HStack className="items-center" style={{ gap: 4 }}>
            <CaretLeftIcon size={20} />
            <Text className="text-base text-foreground">Back</Text>
          </HStack>
        </Pressable>
        <Text className="text-base text-subtle">Details</Text>
      </HStack>

      <Box className="h-px bg-outline-200" />

      {/* Contact Card */}
      <Box className="border-b border-border/10 px-4 py-4">
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1" style={{ gap: 12 }}>
            <Box className="w-12 h-12 relative">
              <Box className="w-12 h-12 rounded-full bg-[#C8D1CE] items-center justify-center">
                <UserIcon size={24} color="#8A9690" weight="light" />
              </Box>
              <Box className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white items-center justify-center">
                {conversation && <ChannelIcon channel={conversation.channel} size={13} />}
              </Box>
            </Box>
            <VStack style={{ gap: 2 }}>
              <Text className="text-foreground text-lg font-medium tracking-tight">
                {conversation?.contact.name.trim() || '—'}
              </Text>
              {conversation?.contact.phone ? (
                <Text className="text-muted text-sm">{conversation.contact.phone}</Text>
              ) : null}
            </VStack>
          </HStack>
        </HStack>
      </Box>

      {/* Messages — inverted so newest is at bottom */}
      <Box className="flex-1">
        <List
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          inverted
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      </Box>

      {/* Bottom */}
      <VStack
        className="rounded-t-2xl"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {conversation?.is_ai_paused !== undefined && (
          <Box className="mx-4">
            <HStack className="items-center justify-between bg-teal-100 rounded-t-2xl px-4 py-2">
              <Text className="text-xs tracking-tighter">Pause AI on this conversation</Text>
              <Text className={`text-xs font-medium ${conversation.is_ai_paused ? 'text-teal-600' : 'text-red-500'}`}>
                {conversation.is_ai_paused ? 'Turn on' : 'Turn off'}
              </Text>
            </HStack>
          </Box>
        )}

        <Box className="bg-white pt-3 border border-border/10 rounded-t-2xl">
          <Box className="mx-4 mb-3">
            <HStack
              className="items-center border border-border/30 bg-background-muted rounded-2xl px-4"
              style={{ gap: 8, minHeight: 44 }}
            >
              <TextInput
                className="flex-1 text-base text-foreground py-3"
                placeholder="Send a message"
                placeholderTextColor="#9BA5A0"
                value={message}
                onChangeText={setMessage}
                multiline
                style={{ fontFamily: 'DM-Sans' }}
              />
            </HStack>
          </Box>
        </Box>
      </VStack>
    </KeyboardAvoidingView>
  );
}
