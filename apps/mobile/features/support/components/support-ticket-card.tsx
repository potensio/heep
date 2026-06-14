import React, { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import type { SupportTicket } from "../types";

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0)
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type Props = {
  item: SupportTicket;
  /** Resolved restaurant name; falls back to the raw id when unknown. */
  restaurantName: string;
  onPress: (id: string) => void;
};

export const SupportTicketCard = memo(({ item, restaurantName, onPress }: Props) => {
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <VStack className="bg-white rounded-[32px] p-4 gap-3 mb-3">
        <HStack className="items-center gap-2">
          <Text
            className="text-foreground text-2xl font-normal flex-1 tracking-tighter"
            numberOfLines={1}
          >
            {restaurantName || "—"}
          </Text>

          <Text className="text-subtle text-lg font-normal tracking-tighter">
            {formatDate(item.last_updated)}
          </Text>
        </HStack>

        {item.last_message.text ? (
          <Text className="text-subtle text-base font-normal" numberOfLines={3}>
            {item.last_message.text}
          </Text>
        ) : null}
      </VStack>
    </Pressable>
  );
});

SupportTicketCard.displayName = "SupportTicketCard";
