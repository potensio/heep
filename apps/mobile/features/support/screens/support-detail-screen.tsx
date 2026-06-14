import React, { useCallback, useMemo, useState } from "react";
import { Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeftIcon, StorefrontIcon, PaperPlaneTiltIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { List } from "@/components/ui/list";
import { useLocations } from "@/features/dashboard/hooks/use-locations";
import { SupportMessageBubble } from "../components/support-message-bubble";
import { MOCK_MESSAGES } from "../data/mock-messages";
import type { SupportMessage, SupportTicket, SupportTicketListResponse } from "../types";

export default function SupportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();

  // Ticket metadata comes from whichever support-tickets list page loaded it,
  // mirroring how conversation-detail reads from the conversations cache.
  const ticket = useMemo<SupportTicket | undefined>(() => {
    const data = queryClient.getQueryData<InfiniteData<SupportTicketListResponse>>([
      "support-tickets",
    ]);
    return data?.pages.flatMap((p) => p.data).find((t) => t.id === id);
  }, [queryClient, id]);

  const { data: locations = [] } = useLocations();
  const restaurantName = useMemo(
    () =>
      locations.find((l) => l.id === ticket?.restaurant_id)?.name ??
      ticket?.restaurant_id ??
      "—",
    [locations, ticket],
  );

  // Thread is still mock/synthesised — real message binding is the next step.
  // Newest-first for the inverted list.
  const baseMessages = useMemo<SupportMessage[]>(() => {
    const seed = MOCK_MESSAGES[id];
    if (seed?.length) return [...seed].reverse();
    if (ticket?.last_message.text) {
      return [
        {
          id: `${id}-detail`,
          text: ticket.last_message.text,
          sent_by: "user",
          sent_at: ticket.last_updated,
        },
      ];
    }
    return [];
  }, [id, ticket]);

  const [sent, setSent] = useState<SupportMessage[]>([]);
  const messages = useMemo(() => [...sent, ...baseMessages], [sent, baseMessages]);

  const renderMessage = useCallback(
    ({ item }: { item: SupportMessage }) => <SupportMessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: SupportMessage) => item.id, []);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    setSent((prev) => [
      { id: `temp-${now}`, text: trimmed, sent_by: "user", sent_at: now },
      ...prev,
    ]);
    setDraft("");
  }, [draft]);

  const canSend = draft.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background-muted"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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

      {/* Ticket Card */}
      <Box className="border-b border-border/10 px-4 py-4">
        <HStack className="items-center flex-1" style={{ gap: 12 }}>
          <Box className="w-12 h-12 rounded-full bg-[#C8D1CE] items-center justify-center">
            <StorefrontIcon size={24} color="#8A9690" weight="light" />
          </Box>
          <VStack style={{ gap: 2 }}>
            <Text className="text-foreground text-lg font-medium tracking-tight">
              {restaurantName}
            </Text>
            <Text className="text-muted text-sm">Heep support</Text>
          </VStack>
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
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      </Box>

      {/* Reply input */}
      <VStack style={{ paddingBottom: insets.bottom + 8 }}>
        <Box className="bg-white pt-3 border border-border/10 rounded-t-2xl">
          <Box className="mx-4 mb-3">
            <HStack
              className="items-center border border-border/30 bg-background-muted rounded-2xl px-4"
              style={{ gap: 8, minHeight: 44 }}
            >
              <TextInput
                className="flex-1 text-base text-foreground py-3"
                placeholder="Reply to support"
                placeholderTextColor="#9BA5A0"
                value={draft}
                onChangeText={setDraft}
                multiline
                style={{ fontFamily: "DM-Sans" }}
              />
              <Pressable onPress={handleSend} disabled={!canSend} hitSlop={8}>
                <PaperPlaneTiltIcon
                  size={22}
                  color={canSend ? "#4A6660" : "#C8D1CE"}
                  weight={canSend ? "fill" : "regular"}
                />
              </Pressable>
            </HStack>
          </Box>
        </Box>
      </VStack>
    </KeyboardAvoidingView>
  );
}
