import React, { useCallback, useState, useRef } from 'react';
import { Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { fetchConversations, fetchConversationMessages } from '../api/conversations.api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeftIcon, UserIcon, PaperPlaneTiltIcon } from 'phosphor-react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { List } from '@/components/ui/list';
import { ChannelIcon } from '../components/channel-icon';
import { SwipeableMessageBubble } from '../components/swipeable-message-bubble';
import { useSendMessage } from '../hooks/use-send-message';
import { usePauseAI } from '../hooks/use-pause-ai';
import type { Conversation, ConversationListResponse, Message } from '../types';

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');

  const queryClient = useQueryClient();
  const { mutate: send, isPending } = useSendMessage(id);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMoreRef = useRef(true);
  const msgCursorRef = useRef<number | null>(null);

  const { data: cached } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) => fetchConversations(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.cursor ?? undefined,
    enabled: false,
  });
  const conversation: Conversation | undefined = cached?.pages
    .flatMap((p) => p.data)
    .find((c) => c.id === id);

  if (msgCursorRef.current === null && conversation) {
    msgCursorRef.current = conversation.messages_pagination.cursor;
    hasMoreRef.current = conversation.messages_pagination.remaining > 0;
  }

  const messages = conversation?.messages ?? [];
  const { toggle: toggleAI } = usePauseAI(conversation);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current || msgCursorRef.current === null) return;
    setLoadingMore(true);
    try {
      const result = await fetchConversationMessages(id, msgCursorRef.current);
      queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
        ['conversations'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((conv) => {
                if (conv.id !== id) return conv;
                const newMessages = result.data.filter(
                  (m) => !conv.messages.some((existing) => existing.id === m.id),
                );
                return {
                  ...conv,
                  messages: [...conv.messages, ...newMessages],
                  messages_pagination: {
                    ...conv.messages_pagination,
                    cursor: conv.messages_pagination.cursor + newMessages.length,
                    remaining: conv.messages_pagination.remaining - newMessages.length,
                  },
                };
              }),
            })),
          };
        },
      );
      msgCursorRef.current = result.pagination.cursor;
      hasMoreRef.current = result.pagination.has_more;
    } finally {
      setLoadingMore(false);
    }
  }, [id, loadingMore, queryClient]);

  const openSwipeableRef = useRef<SwipeableMethods | null>(null);

  const handleSwipeOpen = useCallback((methods: SwipeableMethods) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== methods) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = methods;
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <SwipeableMessageBubble message={item} onSwipeOpen={handleSwipeOpen} />
    ),
    [handleSwipeOpen],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isPending) return;
    send(trimmed, {
      onSuccess: () => setMessage(''),
    });
  }, [message, isPending, send]);

  const canSend = message.trim().length > 0 && !isPending;

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

      {/* Messages */}
      <Box className="flex-1">
        <List
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          inverted
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" className="py-4" /> : null}
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
            <Pressable onPress={toggleAI}>
              <HStack className="items-center justify-between bg-teal-100 rounded-t-2xl px-4 py-2">
                <Text className="text-xs tracking-tighter">AI on this conversation</Text>
                <Text className={`text-xs font-medium ${conversation.is_ai_paused ? 'text-teal-600' : 'text-red-500'}`}>
                  {conversation.is_ai_paused ? 'Resume AI' : 'Pause AI'}
                </Text>
              </HStack>
            </Pressable>
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
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                hitSlop={8}
              >
                <PaperPlaneTiltIcon
                  size={22}
                  color={canSend ? '#4A6660' : '#C8D1CE'}
                  weight={canSend ? 'fill' : 'regular'}
                />
              </Pressable>
            </HStack>
          </Box>
        </Box>
      </VStack>
    </KeyboardAvoidingView>
  );
}
