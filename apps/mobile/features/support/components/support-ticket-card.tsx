import React, { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { Box } from "@/components/ui/box";
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
  onPress: (id: string) => void;
};

function StatusPill({ status }: { status: SupportTicket["status"] }) {
  const open = status === "open";
  return (
    <HStack
      className="items-center rounded-full px-3 py-1"
      style={{ gap: 6, backgroundColor: open ? "#FEF3C7" : "#F0FDF4" }}
    >
      <Box
        className="rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor: open ? "#D97706" : "#16A34A",
        }}
      />
      <Text
        style={{
          fontSize: 11,
          color: open ? "#D97706" : "#16A34A",
          fontFamily: "DM-Sans-Medium",
        }}
      >
        {open ? "Open" : "Resolved"}
      </Text>
    </HStack>
  );
}

export const SupportTicketCard = memo(({ item, onPress }: Props) => {
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <VStack className="bg-white rounded-[32px] p-4 gap-3 mb-3">
        <HStack className="items-center gap-2">
          <Text
            className="text-foreground text-2xl font-normal flex-1 tracking-tighter"
            numberOfLines={1}
          >
            {item.contact.name.trim() || "—"}
          </Text>

          <Text className="text-subtle text-lg font-normal tracking-tighter">
            {formatDate(item.last_message.sent_at)}
          </Text>
        </HStack>

        <HStack style={{ gap: 6 }}>
          <StatusPill status={item.status} />
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
